import { isFalsy, toCamelCase, toKebabCase } from '../utils';
import { EstrelaNode } from './estrela-node';

export function addEventListener(
  node: Node,
  eventName: string,
  handler: EventListener
): () => void {
  node.addEventListener(eventName, handler);
  return () => node.removeEventListener(eventName, handler);
}

export function coerceNode(
  data: any,
  context: {},
  styleId?: string
): Node | EstrelaNode {
  if (data instanceof EstrelaNode) {
    data.setContext(context);
    if (styleId) {
      data.setStyleId(styleId);
    }
    return data;
  }
  if (data instanceof Node) {
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
  const beforeNode = before instanceof EstrelaNode ? before.firstChild : before;
  if (child instanceof EstrelaNode) {
    child.mount(parent, beforeNode, (child as any).context);
  } else if (beforeNode) {
    parent.insertBefore(child, beforeNode);
  } else {
    parent.appendChild(child);
  }
}

export function removeChild(parent: Node, child: Node | EstrelaNode): void {
  if (child instanceof EstrelaNode) {
    child.unmount(parent);
  } else {
    parent.removeChild(child);
  }
}

export function replaceChild(
  parent: Node,
  node: Node | EstrelaNode,
  child: Node | EstrelaNode
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
    } else if (typeof value === 'object') {
      Object.keys(value).forEach(key => {
        element.style.setProperty(toKebabCase(key), value[key]);
      });
    }
    return;
  }

  if (attr.startsWith('style:')) {
    const style = toCamelCase(attr.substring(6));
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

export function template(html: string): HTMLTemplateElement {
  const template = document.createElement('template');
  template.innerHTML = html;
  return template;
}
