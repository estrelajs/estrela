import { NodePath, Visitor } from '@babel/core';
// @ts-ignore
import annotateAsPure from '@babel/helper-annotate-as-pure';
import * as t from '@babel/types';

interface State {
  props: t.Identifier | null;
  states: t.Identifier[];
}

export default function (): Visitor {
  const visitor: Visitor<State> = {
    ['Identifier|MemberExpression|OptionalMemberExpression' as any](
      path: NodePath<t.Expression>,
      state: State
    ) {
      if (
        path.getData('skip') ||
        (t.isIdentifier(path.node) && isMemberExpression(path.parent))
      ) {
        return;
      }
      const statePath = findState(path, state);
      if (statePath) {
        const callee = statePath.parentPath.get('callee');
        if (!Array.isArray(callee) && callee?.isIdentifier({ name: '$' })) {
          return;
        }
        const [expressionPath] = statePath.replaceWith(
          t.memberExpression(statePath.node, t.identifier('$'))
        );
        expressionPath.setData('skip', true);
      }
    },

    AssignmentExpression(path, state) {
      const statePath = findState(path.get('left') as any, state);
      if (statePath) {
        const method = statePath.parentPath.isMemberExpression({
          object: statePath.node,
        })
          ? 'refresh'
          : 'update';
        const param = t.identifier('$$');
        const newState = t.cloneNode(statePath.node);
        statePath.replaceWith(param);
        const callee = t.memberExpression(newState, t.identifier(method));
        const arrowFn = t.arrowFunctionExpression([param], path.node);
        const callExp = t.callExpression(callee, [arrowFn]);
        const [newPath] = path.replaceWith(callExp);
        newPath.get('callee').setData('skip', true);
      }
    },

    JSXExpressionContainer(path, state) {
      path.skip();
      if (
        t.isFunction(path.node.expression) ||
        (t.isCallExpression(path.node.expression) &&
          t.isIdentifier(path.node.expression.callee, { name: '$' }))
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
        path.node.kind = 'const';
        path.node.declarations.forEach(declaration => {
          if (t.isIdentifier(declaration.id)) {
            state.states.push(declaration.id);
            if (declaration.init) {
              declaration.init = t.callExpression(t.identifier('_$$'), [
                declaration.init,
              ]);
              annotateAsPure(declaration.init);
            }
          }
        });
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
        const states: t.Identifier[] = [];
        let props: t.Identifier | null = null;

        // props is an object
        if (t.isIdentifier(param)) {
          props = param;
        }

        // props is destructured
        if (t.isObjectPattern(param)) {
          for (const prop of param.properties) {
            if (t.isObjectProperty(prop) && t.isIdentifier(prop.value)) {
              states.push(prop.value);
            }
            if (t.isRestElement(prop) && t.isIdentifier(prop.argument)) {
              props = prop.argument;
            }
          }
        }

        path.skip();
        path.get('body').traverse(visitor, { props, states, skip: [] });
      }
    },
  };

  function findState(path: NodePath<t.Expression>, state: State) {
    let statePath: NodePath<t.Expression> | null = null;

    const isProps = (node: t.Identifier) => {
      const scope = path.scope.getBindingIdentifier(node.name);
      return scope !== node && state.props === scope;
    };

    const isState = (node: t.Identifier) => {
      const scope = path.scope.getBindingIdentifier(node.name);
      return scope !== node && state.states.includes(scope);
    };

    if (t.isIdentifier(path.node) && isState(path.node)) {
      statePath = path;
    } else if (isMemberExpression(path.node)) {
      path.traverse({
        enter(path) {
          if (
            !t.isIdentifier(path.node) &&
            !t.isMemberExpression(path.node) &&
            !t.isOptionalMemberExpression(path.node)
          ) {
            path.stop();
          }
        },
        Identifier(path) {
          if (isState(path.node)) {
            path.stop();
            statePath = path;
          } else if (isProps(path.node)) {
            path.stop();
            statePath = path.parentPath as any;
          }
        },
      });
    }

    if (statePath?.getData('skip')) {
      return null;
    }

    return statePath;
  }

  function getSelectors(
    path: NodePath<t.JSXExpressionContainer>,
    state: State
  ) {
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
      ['Identifier|MemberExpression' as any](path: NodePath<t.Expression>) {
        const statePath = findState(path, state);
        if (statePath) {
          const sel = statePath.node;
          const name = t.isIdentifier(statePath.node)
            ? statePath.node.name
            : t.isMemberExpression(statePath.node)
            ? String((statePath.node.property as any).name ?? id++)
            : '';
          const param = path.scope.generateUidIdentifier(name);
          let selector = selectors.find(selector =>
            t.isNodesEquivalent(selector.sel, sel)
          );
          if (!selector) {
            selector = { sel, param };
            selectors.push(selector);
          }
          statePath.replaceWith(selector.param);
        }
      },
    });

    return selectors;
  }

  function isMemberExpression(node: Object | null | undefined): boolean {
    return (
      !!node &&
      (t.isMemberExpression(node) || t.isOptionalMemberExpression(node))
    );
  }
}
