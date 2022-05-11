import { NodePath, Visitor } from '@babel/core';
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
    CallExpression(path, state) {
      if (path.get('callee').isIdentifier({ name: 'getState' })) {
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
        } else if (isMemberExpression(param)) {
          const member = param as t.MemberExpression;
          if (t.isIdentifier(member.object)) {
            const scopeNode = path.scope.getBindingIdentifier(
              member.object.name
            );
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
      const scopeNode = path.scope.getBindingIdentifier(path.node.name);
      if (
        scopeNode === path.node ||
        path.parentPath.isMemberExpression({ property: path.node })
      ) {
        return;
      }
      if (state.states.includes(scopeNode)) {
        path.replaceWith(t.memberExpression(t.identifier('_$'), path.node));
        path.skip();
      }
      if (state.props.includes(scopeNode)) {
        path.replaceWith(
          t.memberExpression(t.cloneNode(state.propsParam), path.node)
        );
        path.skip();
      }
    },

    JSXExpressionContainer(path, state) {
      path.skip();
      const expPath = path.get('expression');
      if (
        expPath.isFunction() ||
        (expPath.isCallExpression() &&
          expPath.get('callee').isIdentifier({ name: 'getState' }))
      ) {
        path.traverse(visitor, state);
      } else if (t.isExpression(path.node.expression)) {
        const selectors = getSelectors(path, state);
        if (selectors.length > 0) {
          const arrow = t.arrowFunctionExpression(
            selectors.map(x => x.param),
            path.node.expression
          );
          const array = t.arrayExpression([
            ...selectors.map(x => x.sel),
            arrow,
          ]);
          const expression = t.jsxExpressionContainer(array);
          path.replaceWith(t.inherits(expression, path.node));
        }
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

function getSelectors(path: NodePath<t.JSXExpressionContainer>, state: State) {
  let id = 0;
  const node = path.node;
  const selectors: {
    sel: t.Expression;
    param: t.Identifier;
  }[] = [];

  path.traverse({
    Function(path) {
      if (path.parent === node) {
        path.skip();
      }
    },
    Identifier(path) {
      let sel: t.MemberExpression;
      const scopeNode = path.scope.getBindingIdentifier(path.node.name);
      if (state.states.includes(scopeNode)) {
        sel = t.memberExpression(
          t.memberExpression(t.identifier('_$'), t.identifier('$')),
          path.node
        );
      } else if (state.props.includes(scopeNode)) {
        sel = t.memberExpression(
          t.memberExpression(t.cloneNode(state.propsParam), t.identifier('$')),
          path.node
        );
      } else if (t.isNodesEquivalent(state.propsParam, path.node)) {
        if (isMemberExpression(path.parent)) {
          const parent = t.cloneNode(path.parent) as t.MemberExpression;
          parent.object = t.memberExpression(path.node, t.identifier('$'));
          sel = parent;
        } else {
          sel = t.memberExpression(path.node, t.identifier('$'));
        }
      } else {
        return;
      }
      const name =
        t.isMemberExpression(sel) && t.isIdentifier(sel.property)
          ? sel.property.name
          : String(id++);
      const param = path.scope.generateUidIdentifier(name);
      let selector = selectors.find(selector =>
        t.isNodesEquivalent(selector.sel, sel)
      );
      if (!selector) {
        selector = { sel, param };
        selectors.push(selector);
      }
      path.replaceWith(selector.param);
    },
  });

  return selectors;
}

function isMemberExpression(node: Object | null | undefined): boolean {
  return (
    !!node && (t.isMemberExpression(node) || t.isOptionalMemberExpression(node))
  );
}
