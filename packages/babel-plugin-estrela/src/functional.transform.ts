import { Visitor } from '@babel/core';
// @ts-ignore
import annotateAsPure from '@babel/helper-annotate-as-pure';
import * as t from '@babel/types';

interface State {
  propsParam: t.Identifier;
  props: t.Identifier[];
  states: t.Identifier[];
}

export default function (): Visitor {
  const visitor: Visitor<State> = {
    Identifier(path, state) {
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

      if (/[^$]\$$/.test(path.node.name)) {
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

      if (expPath.isFunction()) {
        path.traverse(visitor, state);
        path.skip();
        return;
      }

      if (expPath.isExpression() && hasStates()) {
        expPath.replaceWith(t.arrowFunctionExpression([], expPath.node));
      }

      function hasStates(): boolean {
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
      }
    },

    VariableDeclaration(path, state) {
      if (path.node.kind === 'let') {
        const nodes = path.node.declarations.reduce((acc, declaration) => {
          if (t.isIdentifier(declaration.id)) {
            state.states.push(declaration.id);
            if (declaration.init) {
              const left = t.memberExpression(
                t.identifier('_$'),
                declaration.id
              );
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

  return {
    Function(path) {
      let funcName: string;
      let returnValue: t.Expression | null = null;

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
          const callExp = t.callExpression(t.identifier('_$$'), []);
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

        path.skip();
        path.node.params[0] = propsParam;
        body.traverse(visitor, { propsParam, props, states: [] });
      }
    },
  };
}
