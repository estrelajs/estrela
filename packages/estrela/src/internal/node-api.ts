import { isFalsy, toCamelCase, toKebabCase } from '../utils';
import { isJsxElement } from './template';

export function coerceNode(data: any): Node | JSX.Element {
  if (isJsxElement(data) || data instanceof Node) {
    return data;
  }
  const text = isFalsy(data) ? '' : String(data);
  return document.createTextNode(text);
}

export function insertChild(
  parent: Node,
  child: Node | JSX.Element,
  before: Node | JSX.Element | null = null
): void {
  const beforeNode = isJsxElement(before) ? before.firstChild : before;
  if (isJsxElement(child)) {
    child.mount(parent, beforeNode);
  } else if (beforeNode) {
    parent.insertBefore(child, beforeNode);
  } else {
    parent.appendChild(child);
  }
}

export function removeChild(child: Node | JSX.Element): void {
  if (isJsxElement(child)) {
    child.unmount();
  } else {
    const parent = child.parentNode;
    if (parent) {
      parent.removeChild(child);
    }
  }
}

export function replaceChild(
  parent: Node,
  node: Node | JSX.Element,
  child: Node | JSX.Element
): void {
  insertChild(parent, node, child);
  removeChild(child);
}

export function setAttribute(
  element: HTMLElement,
  attr: string,
  value: unknown
): void {
  if (attr === 'class') {
    if (typeof value === 'string') {
      element.className = value;
    } else if (Array.isArray(value)) {
      element.className = value.join(' ');
    } else if (value && typeof value === 'object') {
      element.className = Object.entries(value)
        .reduce((acc, [key, value]) => acc + (value ? ` ${key}` : ''), '')
        .trim();
    }
    return;
  }

  if (attr.startsWith('class:')) {
    const klass = attr.substring(6);
    if (isFalsy(value)) {
      element.classList.remove(klass);
    } else {
      element.classList.add(klass);
    }
    return;
  }

  if (attr === 'style') {
    if (typeof value === 'string') {
      element.style.cssText = value;
    } else if (value && typeof value === 'object') {
      const obj = value as Record<string, unknown>;
      Object.keys(value).forEach(key => {
        element.style.setProperty(toKebabCase(key), String(obj[key]));
      });
    }
    return;
  }

  if (attr.startsWith('style:')) {
    const style = toCamelCase(attr.substring(6));
    if (style in element.style) {
      const key = style as any;
      element.style[key] = String(value);
    }
    return;
  }

  if (isFalsy(value)) {
    element.removeAttribute(attr);
  } else if (value === true) {
    element.setAttribute(attr, '');
  } else {
    element.setAttribute(attr, String(value));
  }
}
