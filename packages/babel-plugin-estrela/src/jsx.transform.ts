import { NodePath, PluginPass, Visitor } from '@babel/core';
// @ts-ignore
import annotateAsPure from '@babel/helper-annotate-as-pure';
import * as t from '@babel/types';
import {
  JSXAttribute,
  JSXElement,
  JSXFragment,
  JSXOpeningElement,
  JSXSpreadAttribute,
  ObjectExpression,
} from '@babel/types';

function visitor(): Visitor {
  return {
    JSXAttribute(path) {
      if (t.isJSXElement(path.node.value)) {
        path.node.value = t.jsxExpressionContainer(path.node.value);
      }
    },

    JSXElement: {
      exit(path, file) {
        const callExpr = buildCreateElementCall(path, file);
        path.replaceWith(t.inherits(callExpr, path.node));
      },
    },

    JSXFragment: {
      exit(path, file) {
        const callExpr = buildCreateElementFragmentCall(path);
        if (callExpr) {
          path.replaceWith(t.inherits(callExpr, path.node));
        }
      },
    },

    // JSXExpressionContainer: {
    //   exit(path) {
    //     if (t.isExpression(path.node.expression)) {
    //       const selectors = getSelectors(path);

    //       if (selectors.length > 0) {
    //         const arrow = t.arrowFunctionExpression(
    //           selectors.map(x => x.param),
    //           path.node.expression
    //         );
    //         const array = t.arrayExpression([
    //           ...selectors.map(x => x.sel),
    //           arrow,
    //         ]);
    //         const expression = t.jsxExpressionContainer(array);
    //         path.replaceWith(t.inherits(expression, path.node));
    //         path.skip();
    //       }
    //     }
    //   },
    // },
  };
}

// function getSelectors(path: NodePath<t.JSXExpressionContainer>) {
//   const node = path.node;
//   const selectors: {
//     sel: t.Identifier | t.CallExpression;
//     param: t.Identifier;
//   }[] = [];

//   path.traverse({
//     CallExpression(path) {
//       if (
//         t.isIdentifier(path.node.callee) &&
//         (!path.node.arguments[0] || t.isIdentifier(path.node.arguments[0]))
//       ) {
//         const isState = path.node.arguments.length === 0;
//         const isSync = path.node.arguments.length === 1;

//         if (isState || (isSync && path.node.callee.name === 'sync')) {
//           const sel = isSync ? path.node : path.node.callee;
//           let selector = selectors.find(selector => {
//             return t.isNodesEquivalent(selector.sel, sel);
//           });
//           if (!selector) {
//             const param = t.identifier(
//               `${isSync ? '_sync' : ''}_${
//                 path.node.arguments[0]?.name ?? path.node.callee.name
//               }`
//             );
//             selector = { sel, param };
//             selectors.push(selector);
//           }
//           path.replaceWith(selector.param);
//         }
//       }
//     },
//     ArrowFunctionExpression(path) {
//       if (path.parent === node) {
//         path.skip();
//       }
//     },
//     FunctionExpression(path) {
//       if (path.parent === node) {
//         path.skip();
//       }
//     },
//   });

//   return selectors;
// }

function buildVirtualNode(args: any[]) {
  const node = t.callExpression(t.identifier('_jsx'), args);
  // if (PURE_ANNOTATION) {
  annotateAsPure(node);
  // }
  return node;
}

function buildCreateElementCall(path: NodePath<JSXElement>, file: any) {
  const openingPath = path.get('openingElement');

  return buildVirtualNode([
    getTag(openingPath),
    buildCreateElementOpeningElementAttributes(
      file,
      // path,
      openingPath.get('attributes')
    ),
    ...t.react.buildChildren(path.node),
  ]);
}

// Builds JSX Fragment <></> into
// _jsx(null, null, ...children)
function buildCreateElementFragmentCall(path: NodePath<JSXFragment>) {
  // if (filter && !filter(path.node, file)) return;

  return buildVirtualNode([
    t.nullLiteral(),
    t.nullLiteral(),
    ...t.react.buildChildren(path.node),
  ]);
}

function getTag(openingPath: NodePath<JSXOpeningElement>) {
  const tagExpr = convertJSXIdentifier(openingPath.node.name, openingPath.node);

  let tagName;
  if (t.isIdentifier(tagExpr)) {
    tagName = tagExpr.name;
  } else if (t.isLiteral(tagExpr)) {
    // @ts-expect-error todo(flow->ts) value in missing for NullLiteral
    tagName = tagExpr.value;
  }

  if (t.react.isCompatTag(tagName)) {
    return t.stringLiteral(tagName);
  } else {
    return tagExpr;
  }
}

function convertJSXIdentifier(
  node: t.JSXIdentifier | t.JSXMemberExpression | t.JSXNamespacedName,
  parent: t.JSXOpeningElement | t.JSXMemberExpression
): any {
  if (t.isJSXIdentifier(node)) {
    if (node.name === 'this' && t.isReferenced(node, parent)) {
      return t.thisExpression();
    } else if (t.isValidIdentifier(node.name, false)) {
      // @ts-expect-error todo(flow->ts)
      node.type = 'Identifier';
    } else {
      return t.stringLiteral(node.name);
    }
  } else if (t.isJSXMemberExpression(node)) {
    return t.memberExpression(
      convertJSXIdentifier(node.object, node),
      convertJSXIdentifier(node.property, node)
    );
  } else if (t.isJSXNamespacedName(node)) {
    /**
     * If the flag "throwIfNamespace" is false
     * print XMLNamespace like string literal
     */
    return t.stringLiteral(`${node.namespace.name}:${node.name.name}`);
  }

  return node;
}

function convertAttributeValue(node: any) {
  if (t.isJSXExpressionContainer(node)) {
    return node.expression;
  } else {
    return node;
  }
}

function accumulateAttribute(
  array: ObjectExpression['properties'],
  attribute: NodePath<JSXAttribute | JSXSpreadAttribute>
) {
  if (t.isJSXSpreadAttribute(attribute.node)) {
    const arg = attribute.node.argument;
    // Collect properties into props array if spreading object expression
    if (t.isObjectExpression(arg)) {
      array.push(...arg.properties);
    } else {
      array.push(t.spreadElement(arg));
    }
    return array;
  }

  const value = convertAttributeValue(
    attribute.node.name.name !== 'key'
      ? attribute.node.value || t.booleanLiteral(true)
      : attribute.node.value
  );

  if (attribute.node.name.name === 'key' && value === null) {
    throw attribute.buildCodeFrameError(
      'Please provide an explicit key value. Using "key" as a shorthand for "key={true}" is not allowed.'
    );
  }

  if (
    t.isStringLiteral(value) &&
    !t.isJSXExpressionContainer(attribute.node.value)
  ) {
    value.value = value.value.replace(/\n\s+/g, ' ');

    // "raw" JSXText should not be used from a StringLiteral because it needs to be escaped.
    delete value.extra?.raw;
  }

  if (t.isJSXNamespacedName(attribute.node.name)) {
    // @ts-expect-error mutating AST
    attribute.node.name = t.stringLiteral(
      attribute.node.name.namespace.name + ':' + attribute.node.name.name.name
    );
  } else if (t.isValidIdentifier(attribute.node.name.name, false)) {
    // @ts-expect-error mutating AST
    attribute.node.name.type = 'Identifier';
  } else {
    // @ts-expect-error mutating AST
    attribute.node.name = t.stringLiteral(attribute.node.name.name);
  }

  array.push(
    t.inherits(
      t.objectProperty(
        // @ts-expect-error The attribute.node.name is an Identifier now
        attribute.node.name,
        value
      ),
      attribute.node
    )
  );
  return array;
}

/**
 * The logic for this is quite terse. It's because we need to
 * support spread elements. We loop over all attributes,
 * breaking on spreads, we then push a new object containing
 * all prior attributes to an array for later processing.
 */
function buildCreateElementOpeningElementAttributes(
  file: PluginPass,
  // path: NodePath<JSXElement>,
  attribs: NodePath<JSXAttribute | JSXSpreadAttribute>[]
) {
  const objs = [];
  const props = attribs.reduce(accumulateAttribute, []);

  // if (!useSpread) {
  //   // Convert syntax to use multiple objects instead of spread
  //   let start = 0;
  //   props.forEach((prop, i) => {
  //     if (t.isSpreadElement(prop)) {
  //       if (i > start) {
  //         objs.push(t.objectExpression(props.slice(start, i)));
  //       }
  //       objs.push(prop.argument);
  //       start = i + 1;
  //     }
  //   });
  //   if (props.length > start) {
  //     objs.push(t.objectExpression(props.slice(start)));
  //   }
  // } else if (props.length) {
  objs.push(t.objectExpression(props));
  // }

  if (!objs.length) {
    return t.nullLiteral();
  }

  if (objs.length === 1) {
    return objs[0];
  }

  // looks like we have multiple objects
  if (!t.isObjectExpression(objs[0])) {
    objs.unshift(t.objectExpression([]));
  }

  const helper =
    //  useBuiltIns
    //   ? t.memberExpression(t.identifier('Object'), t.identifier('assign'))
    //   :
    // @ts-ignore
    file.addHelper('extends');

  // spread it
  return t.callExpression(helper, objs);
}

export default visitor;
