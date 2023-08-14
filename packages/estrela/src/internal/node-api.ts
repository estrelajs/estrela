import { isFalsy, toCamelCase, toKebabCase } from '../utils';
import { EstrelaNode, isEstrelaNode } from './template';

export function coerceNode(data: any): Node | EstrelaNode {
  if (isEstrelaNode(data) || data instanceof Node) {
    return data;
  }
  const text = isFalsy(data) ? '' : String(data);
  return document.createTextNode(text);
}

export function insertChild(
  parent: Node,
  child: Node | EstrelaNode,
  before: Node | EstrelaNode | null = null
): void {
  const beforeNode = isEstrelaNode(before) ? before.firstChild : before;
  if (isEstrelaNode(child)) {
    child.mount(parent, beforeNode);
  } else if (beforeNode) {
    parent.insertBefore(child, beforeNode);
  } else {
    parent.appendChild(child);
  }
}

export function removeChild(child: Node | EstrelaNode): void {
  if (isEstrelaNode(child)) {
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
  node: Node | EstrelaNode,
  child: Node | EstrelaNode
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
