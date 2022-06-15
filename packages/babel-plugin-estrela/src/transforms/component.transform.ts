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
  const { stateProxy } = path.state as State;
  const states: t.Identifier[] = [];
  const body = path.get('body');
  let returnValue: t.Expression | null = null;
  let funcName: string;

  // find the function name
  if (
    t.isCallExpression(path.parent) &&
    t.isIdentifier(path.parent.callee, { name: 'styled' })
  ) {
    funcName = 'Styled';
  } else if (t.isVariableDeclarator(path.parent)) {
    funcName = t.isIdentifier(path.parent.id) ? path.parent.id.name : '';
  } else {
    funcName = t.isFunctionDeclaration(path.node)
      ? path.node.id?.name ?? ''
      : '';
  }

  // if function name is not Capital or it's not a block statement, return
  if (
    !funcName[0] ||
    funcName[0] !== funcName[0].toUpperCase() ||
    !body.isBlockStatement()
  ) {
    return;
  }

  // find return statement
  for (const node of body.node.body) {
    if (t.isReturnStatement(node)) {
      returnValue = node.argument ?? null;
    }
  }

  // if return statement is JSX element, means it's a component
  if (t.isJSXElement(returnValue) || t.isJSXFragment(returnValue)) {
    const param = path.node.params[0];
    const props: t.Identifier[] = [];
    let propsParam: t.Identifier = t.identifier('_props');

    // when props is an object
    if (t.isIdentifier(param)) {
      propsParam = param;
    }

    // when props is destructured
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

    // replace props param
    path.node.params[0] = propsParam;

    // taverse the body to look for states
    body.traverse(visitor, { propsParam, props, states });

    // create new proxy state instance;
    if (states.length > 0) {
      const callExp = t.callExpression(stateProxy, []);
      const declarator = t.variableDeclarator(t.identifier('_$'), callExp);
      const declaration = t.variableDeclaration('const', [declarator]);
      body.unshiftContainer('body', declaration);
      annotateAsPure(callExp);
    }
  }
}

const visitor: Visitor<ComponentState> = {
  /** Convert `getState(state)` to `getState(_$, 'state')` */
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
        path.node.arguments = [object, t.stringLiteral(prop)];
        path.skip();
      }
    }
  },

  /**
   * Update references to the local state proxy or component props.
   *
   * @example
   * <div ref={ref$}>{ state }</div> -> <div ref={_$.$.ref}>{ _$.state }</div>
   */
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

  /** Add variable declarations to state proxy. */
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
