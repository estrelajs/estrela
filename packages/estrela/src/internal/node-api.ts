import { isFalsy, toCamelCase, toKebabCase } from '../utils';
import { VirtualNode } from './virtual-node';

export function coerceNode(
  node: JSX.Children,
  context: any
): Node | VirtualNode {
  if (node instanceof VirtualNode) {
    node.context = context;
    return node;
  }
  if (node instanceof Node) {
    return node;
  }
  return document.createTextNode(String(node ?? ''));
}

export function insertChild(
  parent: Node,
  child: Node | VirtualNode,
  before: Node | VirtualNode | null = null
): void {
  const beforeNode = before instanceof VirtualNode ? before.firstChild : before;
  if (child instanceof VirtualNode) {
    child.mount(parent, beforeNode);
  } else if (beforeNode) {
    parent.insertBefore(child, beforeNode);
  } else {
    parent.appendChild(child);
  }
}

export function removeChild(parent: Node, child: Node | VirtualNode): void {
  if (child instanceof VirtualNode) {
    child.unmount(parent);
  } else {
    parent.removeChild(child);
  }
}

export function replaceChild(
  parent: Node,
  node: Node | VirtualNode,
  child: Node | VirtualNode
): void {
  insertChild(parent, node, child);
  removeChild(parent, child);
}

export function setAttribute(
  element: HTMLElement,
  attr: string,
  value: any
): void {
  if (attr === 'class') {
    if (typeof value === 'string') {
      element.className = value;
    } else if (Array.isArray(value)) {
      element.className = value.join(' ');
    } else if (typeof value === 'object') {
      element.className = Object.keys(value)
        .reduce((acc, key) => {
          if (value[key]) {
            acc += ` ${key}`;
          }
          return acc;
        }, '')
        .trim();
    }
    return;
  }
  if (/$class:/.test(attr)) {
    const klass = attr.replace(/^class:/, '');
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
    } else if (typeof value === 'object') {
      Object.keys(value).forEach(key => {
        element.style.setProperty(toKebabCase(key), value[key]);
      });
    }
    return;
  }
  if (/^style:/.test(attr)) {
    const style = toCamelCase(attr.replace(/^style:/, ''));
    if (style in element.style) {
      element.style[style as any] = value;
    }
    return;
  }

  if (isFalsy(value)) {
    element.removeAttribute(attr);
  } else if (value === true) {
    element.setAttribute(attr, '');
  } else {
    element.setAttribute(attr, value);
  }
}

export function mapNodeTree(tree: Node): Record<number, Node> {
  let index = 0;
  const result: Record<number, Node> = {};
  const walk = (node: Node) => {
    if (node instanceof DocumentFragment) {
      result[-1] = node;
    } else {
      result[index++] = node;
    }
    let child = node.firstChild;
    while (child) {
      walk(child);
      child = child.nextSibling;
    }
  };
  walk(tree);
  return result;
}

export function template(html: string): DocumentFragment {
  const template = document.createElement('template');
  template.innerHTML = html;
  return template.content;
}
