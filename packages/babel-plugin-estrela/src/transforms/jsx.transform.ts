import { NodePath } from '@babel/core';
import * as t from '@babel/types';
import { selfClosingTags } from '../shared/tags';
import { State } from '../types';

interface Result {
  index: number;
  isLastChild: boolean;
  parentIndex: number;
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
    isLastChild: false,
    parentIndex: 0,
    props: {},
    template: '',
  };
  transformElement(path, result, true);
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
      if (typeof value === 'string') {
        value = t.stringLiteral(value);
      }
      if (typeof value === 'number') {
        value = t.numericLiteral(value);
      }
      if (typeof value === 'boolean') {
        value = t.booleanLiteral(value);
      }
      if (typeof value === null) {
        value = t.nullLiteral();
      }
      if (typeof value === 'undefined') {
        value = t.identifier('undefined');
      }
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
            } else if (expression.isExpression()) {
              if (/^key|ref|on:.+|bind.*$/.test(name)) {
                props[name] = expression.node;
              } else {
                props[name] = t.arrowFunctionExpression([], expression.node);
              }
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

function transformElement(
  path: NodePath<JSXElement>,
  result: Result,
  isRoot?: boolean
): void {
  if (path.isJSXElement()) {
    const tagName = getTagName(path.node);
    const tagIsComponent = isComponent(tagName);
    const isSelfClosing = !tagIsComponent && selfClosingTags.includes(tagName);
    const props = getAttrProps(path);

    if (tagIsComponent) {
      if (isRoot) {
        result.props = props;
        const children = getChildren(path);
        if (children.length === 1) {
          result.props.children = children[0];
        }
        if (children.length > 1) {
          result.props.children = children;
        }
      } else {
        transformJSX(path);
        replaceChild(path.node, result);
      }
    } else {
      result.template += `<${tagName}`;
      handleAttributes(props, result);
      result.template += isSelfClosing ? '/>' : '>';
      if (!isSelfClosing) {
        transformChildren(path, result);
        result.template += `</${tagName}>`;
      }
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
    .map(child => {
      if (child.isJSXElement() || child.isJSXFragment()) {
        transformJSX(child);
      } else if (child.isJSXExpressionContainer()) {
        child.replaceWith(child.get('expression'));
      } else if (child.isJSXText()) {
        child.replaceWith(t.stringLiteral(child.node.value));
      } else {
        throw new Error('Unsupported JSX child');
      }
      return child.node;
    });
}

function handleAttributes(props: Record<string, any>, result: Result): void {
  let klass = '';
  let style = '';

  for (const prop in props) {
    const value = props[prop];

    if (prop === 'class' && typeof value === 'string') {
      klass += ` ${value}`;
      delete props[prop];
      continue;
    }
    if (/^class:/.test(prop)) {
      if (value === true) {
        const name = prop.replace(/^class:/, '');
        klass += ` ${name}`;
        delete props[prop];
        continue;
      }
      if (value === false) {
        delete props[prop];
        continue;
      }
    }

    if (prop === 'style' && typeof value === 'string') {
      style += `${value}${value.at(-1) === ';' ? '' : ';'}`;
      delete props[prop];
      continue;
    }
    if (/^style:/.test(prop)) {
      if (typeof value === 'string' || typeof value === 'number') {
        const name = prop.replace(/^style:/, '');
        style += `${name}:${value};`;
        delete props[prop];
        continue;
      }
    }

    if (value === true) {
      result.template += ` ${prop}`;
      delete props[prop];
    }
    if (value === false) {
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

  klass = klass.trim();
  style = style.trim();

  if (klass) {
    result.template += ` class="${klass}"`;
  }
  if (style) {
    result.template += ` style="${style}"`;
  }
}

function transformChildren(path: NodePath<JSXElement>, result: Result): void {
  const parentIndex = result.index;
  path
    .get('children')
    .filter(isValidChild)
    .forEach((child, i, arr) => {
      result.parentIndex = parentIndex;
      result.isLastChild = i === arr.length - 1;
      transformChild(child, result);
    });
}

function transformChild(child: NodePath<JSXChild>, result: Result) {
  result.index++;
  if (child.isJSXElement() || child.isJSXFragment()) {
    transformElement(child, result);
  } else if (child.isJSXExpressionContainer()) {
    const expression = child.get('expression');
    if (expression.isStringLiteral() || expression.isNumericLiteral()) {
      result.template += expression.node.value;
    } else if (expression.isExpression()) {
      replaceChild(expression.node, result);
    } else {
      throw new Error('Unsupported JSX child');
    }
  } else if (child.isJSXText()) {
    result.template += child.node.value;
  } else {
    throw new Error('Unsupported JSX child');
  }
}

function replaceChild(node: t.Expression, result: Result): void {
  if (result.isLastChild) {
    result.index--;
  } else {
    result.template += '<!>';
  }
  result.props[result.parentIndex!] ??= {};
  result.props[result.parentIndex!].children ??= [];
  result.props[result.parentIndex!].children.push(
    t.arrayExpression([
      t.arrowFunctionExpression([], node),
      result.isLastChild ? t.nullLiteral() : t.identifier(String(result.index)),
    ])
  );
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
