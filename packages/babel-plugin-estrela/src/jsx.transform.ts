import { NodePath, Visitor } from '@babel/core';
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
      exit(path) {
        const callExpr = buildJSXElementCall(path);
        path.replaceWith(t.inherits(callExpr, path.node));
      },
    },

    JSXFragment: {
      exit(path) {
        const callExpr = buildJSXFragmentCall(path);
        if (callExpr) {
          path.replaceWith(t.inherits(callExpr, path.node));
        }
      },
    },
  };
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

function buildChildrenProperty(children: t.Expression[]) {
  let childrenNode;
  if (children.length === 1) {
    childrenNode = children[0];
  } else if (children.length > 1) {
    childrenNode = t.arrayExpression(children);
  } else {
    return undefined;
  }

  return t.objectProperty(t.identifier('children'), childrenNode);
}

// Builds JSX into:
// Production: React.jsx(type, arguments, key)
// Development: React.jsxDEV(type, arguments, key, isStaticChildren, source, self)
function buildJSXElementCall(path: NodePath<JSXElement>) {
  const openingPath = path.get('openingElement');
  const args = [getTag(openingPath)];

  const attribsArray = [];
  const extracted = Object.create(null);

  // for React.jsx, key, __source (dev), and __self (dev) is passed in as
  // a separate argument rather than in the args object. We go through the
  // props and filter out these three keywords so we can pass them in
  // as separate arguments later
  for (const attr of openingPath.get('attributes')) {
    if (attr.isJSXAttribute() && t.isJSXIdentifier(attr.node.name)) {
      const { name } = attr.node.name;
      switch (name) {
        case '__source':
        case '__self':
          if (extracted[name]) throw sourceSelfError(path, name);
        /* falls through */
        case 'key': {
          const keyValue = convertAttributeValue(attr.node.value);
          if (keyValue === null) {
            throw attr.buildCodeFrameError(
              'Please provide an explicit key value. Using "key" as a shorthand for "key={true}" is not allowed.'
            );
          }

          extracted[name] = keyValue;
          break;
        }
        default:
          attribsArray.push(attr);
      }
    } else {
      attribsArray.push(attr);
    }
  }

  const children = t.react.buildChildren(path.node);

  let attribs: t.ObjectExpression;

  if (attribsArray.length || children.length) {
    attribs = buildJSXOpeningElementAttributes(
      attribsArray,
      //@ts-expect-error The children here contains JSXSpreadChild,
      // which will be thrown later
      children
    );
  } else {
    // attributes should never be null
    attribs = t.objectExpression([]);
  }

  args.push(attribs);

  if (extracted.key !== undefined) {
    args.push(extracted.key);
  }

  return call('_jsx', args);
}

// Builds JSX Fragment <></> into
// Production: React.jsx(type, arguments)
// Development: React.jsxDEV(type, { children })
function buildJSXFragmentCall(path: NodePath<JSXFragment>) {
  const args = [t.nullLiteral()] as t.Expression[];

  const children = t.react.buildChildren(path.node);

  args.push(
    t.objectExpression(
      children.length > 0
        ? ([
            buildChildrenProperty(
              //@ts-expect-error The children here contains JSXSpreadChild,
              // which will be thrown later
              children
            ),
          ].filter(x => x) as any)
        : []
    )
  );

  return call('_jsx', args);
}

// Builds props for React.jsx. This function adds children into the props
// and ensures that props is always an object
function buildJSXOpeningElementAttributes(
  attribs: NodePath<JSXAttribute | JSXSpreadAttribute>[],
  children: t.Expression[]
) {
  const props = attribs.reduce(accumulateAttribute, []);

  // In React.jsx, children is no longer a separate argument, but passed in
  // through the argument object
  if (children?.length > 0) {
    const childrenProp = buildChildrenProperty(children);
    if (childrenProp) {
      props.push(childrenProp);
    }
  }

  return t.objectExpression(props);
}

function call(name: string, args: t.CallExpression['arguments']) {
  const node = t.callExpression(t.identifier(name), args);
  annotateAsPure(node);
  return node;
}

function convertAttributeValue(node: any) {
  if (t.isJSXExpressionContainer(node)) {
    return node.expression;
  } else {
    return node;
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

function sourceSelfError(path: NodePath, name: string) {
  return path.buildCodeFrameError(`Duplicate ${name} prop found.`);
}

export default visitor;
