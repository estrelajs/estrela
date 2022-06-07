import { NodePath, Visitor } from '@babel/core';
// @ts-ignore
import annotateAsPure from '@babel/helper-annotate-as-pure';
import * as t from '@babel/types';
import { getOptions } from '../shared/utils';
import { State } from '../types';

interface ComponentState {
  propsParam: t.Identifier;
  props: t.Identifier[];
  states: t.Identifier[];
}

export function transformComponent(path: NodePath<t.Function>): void {
  const state: State = path.state;
  let returnValue: t.Expression | null = null;
  let funcName: string;

  if (t.isVariableDeclarator(path.parent)) {
    funcName = t.isIdentifier(path.parent.id) ? path.parent.id.name : '';
  } else {
    funcName = t.isFunctionDeclaration(path.node)
      ? path.node.id?.name ?? ''
      : '';
  }

  // if function name is not capital, means it's not a component
  if (!funcName[0] || funcName[0] !== funcName[0].toUpperCase()) {
    return;
  }

  // find return statement
  if (t.isBlockStatement(path.node.body)) {
    for (const node of path.node.body.body) {
      if (t.isReturnStatement(node)) {
        returnValue = node.argument ?? null;
      }
    }
  } else {
    returnValue = path.node.body;
  }

  // if return statement is JSX element, means it's a component
  if (t.isJSXElement(returnValue) || t.isJSXFragment(returnValue)) {
    const param = path.node.params[0];
    const props: t.Identifier[] = [];
    let propsParam: t.Identifier = t.identifier('_props');

    // create new proxy state instance;
    const body = path.get('body');
    if (body.isBlockStatement()) {
      const callExp = t.callExpression(state.stateProxy, []);
      const declaration = t.variableDeclarator(t.identifier('_$'), callExp);
      body.unshiftContainer(
        'body',
        t.variableDeclaration('const', [declaration])
      );
      annotateAsPure(callExp);
    }

    // props is an object
    if (t.isIdentifier(param)) {
      propsParam = param;
    }

    // props is destructured
    if (t.isObjectPattern(param)) {
      for (const prop of param.properties) {
        if (t.isObjectProperty(prop) && t.isIdentifier(prop.value)) {
          props.push(prop.value);
        }
        if (t.isRestElement(prop) && t.isIdentifier(prop.argument)) {
          propsParam = prop.argument;
        }
      }
    }

    path.node.params[0] = propsParam;
    body.traverse(visitor, { propsParam, props, states: [] });
  }
}

const visitor: Visitor<ComponentState> = {
  CallExpression(path, state) {
    const { enableGetStateFunction } = getOptions(path);
    if (
      enableGetStateFunction &&
      path.get('callee').isIdentifier({ name: 'getState' })
    ) {
      const param = path.node.arguments[0];
      let object: t.Identifier | null = null;
      let prop: string | null = null;

      if (t.isIdentifier(param)) {
        const scopeNode = path.scope.getBindingIdentifier(param.name);
        if (state.states.includes(scopeNode)) {
          object = t.identifier('_$');
          prop = param.name;
        }
        if (state.props.includes(scopeNode)) {
          object = state.propsParam;
          prop = param.name;
        }
      } else if (
        t.isMemberExpression(param) ||
        t.isOptionalMemberExpression(param)
      ) {
        const member = param as t.MemberExpression;
        if (t.isIdentifier(member.object)) {
          const scopeNode = path.scope.getBindingIdentifier(member.object.name);
          if (state.propsParam === scopeNode) {
            object = state.propsParam;
            prop = (member.property as t.Identifier)?.name ?? '0';
          }
        }
      }
      if (object && prop) {
        path.skip();
        path.node.arguments = [object, t.stringLiteral(prop)];
      }
    }
  },

  Identifier(path, state) {
    const { getStateWithDolarSuffix } = getOptions(path);
    const updateNode = (node: t.Identifier, isDolar?: boolean) => {
      const scopeNode = path.scope.getBindingIdentifier(node.name);
      if (
        scopeNode === node ||
        path.parentPath.isMemberExpression({ property: node })
      ) {
        return false;
      }
      const getObject = (obj: t.Identifier) => {
        return isDolar ? t.memberExpression(obj, t.identifier('$')) : obj;
      };
      if (state.states.includes(scopeNode)) {
        path.skip();
        path.replaceWith(
          t.memberExpression(getObject(t.identifier('_$')), node)
        );
        return true;
      }
      if (state.props.includes(scopeNode)) {
        path.skip();
        path.replaceWith(
          t.memberExpression(getObject(t.cloneNode(state.propsParam)), node)
        );
        return true;
      }
    };
    if (getStateWithDolarSuffix && /[^$]\$$/.test(path.node.name)) {
      const node = t.identifier(path.node.name.replace(/\$$/, ''));
      if (updateNode(node, true)) {
        return;
      }
      if (
        path.parentPath.isMemberExpression({ property: path.node }) ||
        path.parentPath.isOptionalMemberExpression({ property: path.node })
      ) {
        const object = path.parentPath.node.object;
        if (t.isIdentifier(object)) {
          const scopeNode = path.scope.getBindingIdentifier(object.name);
          if (state.propsParam === scopeNode) {
            path.parentPath.replaceWith(
              t.memberExpression(
                t.memberExpression(object, t.identifier('$')),
                node
              )
            );
            return;
          }
        }
      }
    }
    updateNode(path.node);
  },

  JSXExpressionContainer(path, state) {
    const expPath = path.get('expression');
    if (
      expPath.isFunction() ||
      (expPath.isCallExpression() &&
        expPath.get('callee').isIdentifier({ name: 'getState' }))
    ) {
      path.traverse(visitor, state);
      path.skip();
      return;
    }

    const hasStates = () => {
      const node = path.node;
      let hasState = false;

      path.traverse({
        Function(path) {
          if (path.parent === node) {
            path.skip();
          }
        },
        Identifier(path) {
          const scopeNode = path.scope.getBindingIdentifier(path.node.name);
          if (
            state.states.includes(scopeNode) ||
            state.props.includes(scopeNode) ||
            t.isNodesEquivalent(state.propsParam, path.node)
          ) {
            hasState = true;
            path.stop();
          }
        },
      });

      return hasState;
    };

    if (expPath.isExpression() && hasStates()) {
      expPath.replaceWith(t.arrowFunctionExpression([], expPath.node));
    }
  },

  VariableDeclaration(path, state) {
    if (path.node.kind === 'let') {
      const nodes = path.node.declarations.reduce((acc, declaration) => {
        if (t.isIdentifier(declaration.id)) {
          state.states.push(declaration.id);
          if (declaration.init) {
            const left = t.memberExpression(t.identifier('_$'), declaration.id);
            const assignment = t.assignmentExpression(
              '=',
              left,
              declaration.init
            );
            acc.push(assignment);
          }
        }
        return acc;
      }, [] as t.AssignmentExpression[]);
      path.replaceWithMultiple(nodes);
    }
  },
};
