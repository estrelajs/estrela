import { NodePath, Visitor } from '@babel/core';
import * as t from '@babel/types';

interface State {
  props: t.Identifier | null;
  states: t.Identifier[];
  skip: Object[];
  skipMethod: boolean;
}

export default function (): Visitor {
  const visitor: Visitor<State> = {
    enter(path, state) {
      if (state.skip.includes(path.node)) {
        path.skip();
      }
    },

    AssignmentExpression(path, state) {
      if (state.skipMethod) {
        return;
      }

      const [, operator] = /([^=]+)=$/.exec(path.node.operator) ?? [];
      const param = t.identifier('$$');
      const left = path.node.left;
      const right = path.node.right;
      let method: 'next' | 'refresh' | 'update' | null = null;
      let stateExp: t.Expression | null = null;

      const visitor: Visitor = {
        enter(path) {
          if (path.node === right) {
            path.skip();
          }
        },
        MemberExpression(path) {
          if (isState(path, state)) {
            path.stop();
            stateExp = path.node;
            method = operator ? 'update' : 'next';
          }
        },
        Identifier(path: NodePath<t.Identifier>) {
          if (isState(path, state)) {
            path.stop();
            stateExp = path.node;

            if (t.isMemberExpression(path.parent)) {
              method = 'refresh';
              if (path.parent !== left) {
                stateExp = path.parent;
              }
            } else if (path.node === left && !operator) {
              method = 'next';
            } else {
              method = 'update';
            }
          }
        },
      };

      path.traverse(visitor);

      if (stateExp && method) {
        const args: any[] = [];
        const callee = t.memberExpression(stateExp, t.identifier(method));

        if (method === 'next') {
          args.push(path.node.right);
        } else if (method === 'refresh') {
          if (t.isMemberExpression(left)) {
            left.object = param;
          }
          const exp = t.assignmentExpression('=', left, path.node.right);
          args.push(t.arrowFunctionExpression([param], exp));
        } else if (operator) {
          const exp = t.binaryExpression(
            operator as any,
            param,
            path.node.right
          );
          args.push(t.arrowFunctionExpression([param], exp));
        }

        state.skip = [callee];
        state.skipMethod = true;
        path.replaceWith(t.callExpression(callee, args));
        state.skipMethod = false;
      }
    },

    CallExpression(path, state) {
      if (t.isIdentifier(path.node.callee)) {
        if (['$'].includes(path.node.callee.name)) {
          path.skip();
        }
      }
    },

    Identifier(path, state) {
      replaceStates(path, state);
    },

    JSXExpressionContainer(path, state) {
      path.skip();
      if (
        t.isFunction(path.node.expression) ||
        (t.isCallExpression(path.node.expression) &&
          t.isIdentifier(path.node.expression.callee) &&
          path.node.expression.callee.name === '$')
      ) {
        state.skip = [];
        state.skipMethod = false;
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

    MemberExpression(path, state) {
      replaceStates(path, state);
    },

    UpdateExpression(path, state) {
      const argumentPath = path.get('argument');
      if (isState(argumentPath, state)) {
        const callee = t.memberExpression(
          argumentPath.node,
          t.identifier('update')
        );
        const param = t.identifier('$$');
        const arrowFn = t.arrowFunctionExpression([param], path.node);
        path.node.argument = param;
        state.skip = [callee, arrowFn];
        path.replaceWith(t.callExpression(callee, [arrowFn]));
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
            }
          }
        });
      }
    },

    VariableDeclarator(path, state) {
      state.skip = [path.node.id];
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
        path.get('body').traverse(visitor, {
          props,
          states,
          skip: [],
          skipMethod: false,
        });
      }
    },
  };

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
      Identifier(path) {
        lookForSelector(path, state);
      },
      MemberExpression(path) {
        lookForSelector(path, state);
      },
    });

    function lookForSelector(path: NodePath<t.Expression>, state: State) {
      if (isState(path, state)) {
        const sel = path.node;
        const name = t.isIdentifier(path.node)
          ? path.node.name
          : t.isMemberExpression(path.node)
          ? String((path.node.property as any).name ?? id++)
          : '';
        const param = t.identifier(`_${name}`);
        let selector = selectors.find(selector =>
          t.isNodesEquivalent(selector.sel, sel)
        );
        if (!selector) {
          selector = { sel, param };
          selectors.push(selector);
        }
        path.replaceWith(selector.param);
      }
    }

    return selectors;
  }

  function isState(path: NodePath<any>, state: State): boolean {
    if (t.isIdentifier(path.node)) {
      const scope = path.scope.getBindingIdentifier(path.node.name);
      return !!scope && state.states.includes(scope);
    }
    if (t.isMemberExpression(path.node) && t.isIdentifier(path.node.object)) {
      const scope = path.scope.getBindingIdentifier(path.node.object.name);
      return !!scope && scope === state.props;
    }
    return false;
  }

  function replaceStates(path: NodePath<t.Expression>, state: State) {
    if (isState(path, state)) {
      path.skip();
      const state = t.memberExpression(path.node, t.identifier('$'));
      if (t.isMemberExpression(path.parent)) {
        if (path.parent.object === path.node) {
          path.parent.object = state;
        } else {
          path.parent.object = t.cloneNode(path.parent);
          path.parent.property = t.identifier('$');
        }
      } else {
        path.replaceWith(state);
      }
    }
  }
}
