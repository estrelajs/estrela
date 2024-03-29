import { NodePath, types as t } from '@babel/core';
import { selfClosingTags, svgTags } from '../shared/tags';
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
    index: 1,
    isLastChild: false,
    parentIndex: 0,
    props: {},
    template: '',
  };
  transformElement(path, result, true);
  path.replaceWith(createEstrelaNode(path, result));
}

function createEstrelaNode(
  path: NodePath<JSXElement>,
  result: Result
): t.CallExpression {
  const state: State = path.state;
  let tmpl: t.Identifier;
  if (path.isJSXElement() && isComponent(getTagName(path.node))) {
    tmpl = t.identifier(getTagName(path.node));
  } else {
    tmpl = path.scope.generateUidIdentifier('_tmpl$');
    const template = t.callExpression(state.template, [
      t.stringLiteral(result.template),
    ]);
    const declarator = t.variableDeclarator(tmpl, template);
    state.tmplDeclaration.declarations.push(declarator);
  }
  const args = [tmpl, createProps(result.props)];
  const key = result.props.key ?? result.props[0]?.key;
  if (key) {
    args.push(key);
  }
  return t.callExpression(state.h, args);
}

function createProps(props: Record<string, any>): t.ObjectExpression {
  const result: (t.ObjectProperty | t.SpreadElement)[] = [];
  for (const prop in props) {
    let value = props[prop];
    if (prop === 'key') {
      continue;
    }
    if (Array.isArray(value)) {
      value = t.arrayExpression(value);
    }
    if (typeof value === 'object' && value !== null && !t.isNode(value)) {
      value = createProps(value);
    }
    if (typeof value === 'string') {
      value = t.stringLiteral(value);
    }
    if (typeof value === 'number') {
      value = t.numericLiteral(value);
    }
    if (typeof value === 'boolean') {
      value = t.booleanLiteral(value);
    }
    if (value === undefined) {
      value = t.tsUndefinedKeyword();
    }
    if (value === null) {
      value = t.nullLiteral();
    }
    if (prop === '_$spread$') {
      result.push(t.spreadElement(value));
    } else {
      result.push(t.objectProperty(t.stringLiteral(prop), value));
    }
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
      } else if (attribute.isJSXSpreadAttribute()) {
        props['_$spread$'] = attribute.get('argument').node;
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
    const isSvgTemplate = svgTags.includes(tagName) && result.index === 1;
    const props = getAttrProps(path);

    if (tagIsComponent) {
      if (isRoot) {
        result.props = props;
        const children = getChildren(path) as any;
        if (children.length) {
          const childrenGetter = t.arrowFunctionExpression(
            [],
            children.length === 1 ? children[0] : t.arrayExpression(children)
          );
          result.props.children = childrenGetter;
        }
      } else {
        transformJSX(path);
        replaceChild(path.node, result);
      }
    } else {
      if (isSvgTemplate) {
        result.template += `<svg _tmpl_>`;
      }
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

function getChildren(path: NodePath<t.JSXElement>): JSXChild[] {
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
    .reduce((acc, child) => {
      if (isValidChild(child)) {
        const lastChild = acc.at(-1);
        if (lastChild && isTextChild(child) && isTextChild(lastChild)) {
          setNodeText(lastChild, getNodeText(lastChild) + getNodeText(child));
        } else {
          acc.push(child);
        }
      }
      return acc;
    }, [] as NodePath<JSXChild>[])
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
  result.props[result.parentIndex] ??= {};
  result.props[result.parentIndex].children ??= [];
  result.props[result.parentIndex].children.push(
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

function getNodeText(path: NodePath<JSXChild>): string {
  if (path.isJSXText()) {
    return path.node.value;
  }
  if (path.isJSXExpressionContainer()) {
    const expression = path.get('expression');
    if (expression.isStringLiteral() || expression.isNumericLiteral()) {
      return String(expression.node.value);
    }
  }
  return '';
}

function setNodeText(path: NodePath<JSXChild>, text: string): void {
  if (path.isJSXText()) {
    path.node.value = text;
  }
  if (path.isJSXExpressionContainer()) {
    const expression = path.get('expression');
    if (expression.isStringLiteral() || expression.isNumericLiteral()) {
      expression.replaceWith(t.stringLiteral(text));
    }
  }
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

function isTextChild(path: NodePath<JSXChild>): boolean {
  if (path.isJSXExpressionContainer()) {
    const expression = path.get('expression');
    if (
      expression.isJSXText() ||
      expression.isStringLiteral() ||
      expression.isNumericLiteral()
    ) {
      return true;
    }
  }
  if (path.isJSXText() || path.isStringLiteral() || path.isNullLiteral()) {
    return true;
  }
  return false;
}

function isValidChild(path: NodePath<JSXChild>): boolean {
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
