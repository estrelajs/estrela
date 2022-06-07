import { NodePath } from '@babel/core';
import * as t from '@babel/types';
import { State } from '../types';

interface Result {
  index: number;
  props: Record<string, any>;
  template: string;
}

type JSXElement = t.JSXElement | t.JSXFragment;

type JSXChild =
  | t.JSXElement
  | t.JSXFragment
  | t.JSXExpressionContainer
  | t.JSXSpreadChild
  | t.JSXText;

export function transformJSX(path: NodePath<JSXElement>): void {
  const result: Result = {
    index: 0,
    props: {},
    template: '',
  };
  transformElement(path, result);
  path.replaceWith(createVirtualNode(path, result));
}

function createVirtualNode(
  path: NodePath<JSXElement>,
  result: Result
): t.CallExpression {
  const state: State = path.state;
  let tmpl: t.Identifier;
  if (path.isJSXElement() && isComponent(getTagName(path.node))) {
    tmpl = t.identifier(getTagName(path.node));
  } else {
    tmpl = path.scope.generateUidIdentifier('_tmpl');
    const template = t.callExpression(state.template, [
      t.stringLiteral(result.template),
    ]);
    const declarator = t.variableDeclarator(tmpl, template);
    state.tmplDeclaration.declarations.push(declarator);
  }
  const args = [tmpl, createProps(result.props)];
  if (result.props.key) {
    args.push(result.props.key);
  }
  return t.callExpression(state.h, args);
}

function createProps(props: Record<string, any>): t.ObjectExpression {
  const result: t.ObjectProperty[] = [];
  for (const prop in props) {
    let value = props[prop];
    if (prop === 'key') {
      continue;
    }
    if (Array.isArray(value)) {
      value = t.arrayExpression(value);
    }
    if (typeof value === 'object' && !t.isNode(value)) {
      value = createProps(props[prop]);
    }
    if (typeof value !== 'object') {
      value = t.identifier(value);
    }
    result.push(t.objectProperty(t.stringLiteral(prop), value));
  }
  return t.objectExpression(result);
}

function getAttrProps(path: NodePath<t.JSXElement>): Record<string, any> {
  const props: Record<string, any> = {};
  path
    .get('openingElement')
    .get('attributes')
    .forEach(attribute => {
      if (attribute.isJSXAttribute()) {
        const name = getAttrName(attribute.node);
        const value = attribute.get('value');
        if (!value.node) {
          props[name] = true;
        } else if (value.isStringLiteral()) {
          props[name] = value.node.value;
        } else {
          if (value.isJSXExpressionContainer()) {
            const expression = value.get('expression');
            if (expression.isStringLiteral()) {
              props[name] = expression.node.value;
            } else if (expression.isNumericLiteral()) {
              props[name] = expression.node.value;
            } else if (
              expression.isJSXElement() ||
              expression.isJSXFragment()
            ) {
              transformJSX(expression);
              props[name] = expression.node;
            } else {
              props[name] = value.get('expression').node;
            }
          } else if (value.isJSXElement() || value.isJSXFragment()) {
            transformJSX(value);
            props[name] = value.node;
          }
        }
      } else {
        throw new Error('Unsupported attribute type');
      }
    });
  return props;
}

function transformElement(path: NodePath<JSXElement>, result: Result): void {
  if (path.isJSXElement()) {
    const tagName = getTagName(path.node);
    const tagIsComponent = isComponent(tagName);
    const props = getAttrProps(path);

    if (tagIsComponent) {
      result.props = props;
      const children = getChildren(path);
      if (children.length === 1) {
        result.props.children = children[0];
      }
      if (children.length > 1) {
        result.props.children = children;
      }
    } else {
      result.template += `<${tagName}`;

      // attributes
      for (const prop in props) {
        const value = props[prop];
        if (value === true) {
          result.template += ` ${prop}`;
          delete props[prop];
        }
        if (typeof value === 'string' || typeof value === 'number') {
          result.template += ` ${prop}="${value}"`;
          delete props[prop];
        }
      }
      if (Object.keys(props).length > 0) {
        result.props[result.index] = props;
      }

      result.template += '>';
      transformChildren(path, result);
      result.template += `</${tagName}>`;
    }
  } else {
    result.index--;
    transformChildren(path, result);
  }
}

function getChildren(path: NodePath<t.JSXElement>) {
  return path
    .get('children')
    .filter(isValidChild)
    .map((child, i) => {
      if (child.isJSXElement() || child.isJSXFragment()) {
        transformJSX(child);
      } else if (child.isJSXExpressionContainer()) {
        child.replaceWith(child.get('expression'));
      } else if (child.isJSXText()) {
        child.replaceWith(t.stringLiteral(child.node.value));
      }
      return child.node;
    });
}

function transformChildren(path: NodePath<JSXElement>, result: Result): void {
  const parentIndex = result.index;
  path
    .get('children')
    .filter(isValidChild)
    .forEach((child, i, arr) =>
      transformChild(child, result, parentIndex, i === arr.length - 1)
    );
}

function transformChild(
  child: NodePath<JSXChild>,
  result: Result,
  parentIndex: number,
  isLastChild: boolean
) {
  result.index++;
  if (child.isJSXElement() || child.isJSXFragment()) {
    transformElement(child, result);
  } else if (child.isJSXExpressionContainer()) {
    const expression = child.get('expression');
    if (expression.isStringLiteral()) {
      result.template += expression.node.value;
      return;
    }
    if (!isLastChild) {
      result.template += '<!>';
    }
    result.props[parentIndex] ??= {};
    result.props[parentIndex].children ??= [];
    result.props[parentIndex].children.push(
      t.arrayExpression([
        expression.node as any,
        isLastChild ? t.nullLiteral() : t.identifier(String(result.index)),
      ])
    );
  } else if (child.isJSXText()) {
    result.template += child.node.value;
    child.replaceWith(t.stringLiteral(child.node.value));
  } else {
    throw new Error('Unsupported JSX child');
  }
}

function getAttrName(attribute: t.JSXAttribute): string {
  if (t.isJSXIdentifier(attribute.name)) {
    return attribute.name.name;
  }
  if (t.isJSXNamespacedName(attribute.name)) {
    return `${attribute.name.namespace.name}:${attribute.name.name.name}`;
  }
  throw new Error('Unsupported attribute type');
}

function getTagName(node: t.JSXElement): string {
  const jsxName = node.openingElement.name;
  return jsxElementNameToString(jsxName);
}

function isComponent(tagName: string): boolean {
  return (
    (tagName[0] && tagName[0].toLowerCase() !== tagName[0]) ||
    tagName.includes('.') ||
    /[^a-zA-Z]/.test(tagName[0])
  );
}

function isValidChild(path: NodePath): boolean {
  const regex = /^\s*$/;
  if (path.isStringLiteral() || path.isJSXText()) {
    return !regex.test(path.node.value);
  }
  return true;
}

function jsxElementNameToString(
  node: t.JSXMemberExpression | t.JSXIdentifier | t.JSXNamespacedName
): string {
  if (t.isJSXMemberExpression(node)) {
    return `${jsxElementNameToString(node.object)}.${node.property.name}`;
  }
  if (t.isJSXIdentifier(node) || t.isIdentifier(node)) {
    return node.name;
  }
  return `${node.namespace.name}:${node.name.name}`;
}
