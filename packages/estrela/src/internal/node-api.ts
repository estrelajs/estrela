import { isFalsy } from '../utils';
import { VirtualNode } from './virtual-node';

export function coerceNode(node: JSX.Child): Node | VirtualNode {
  if (node instanceof VirtualNode) {
    return node;
  }
  if (node instanceof Node) {
    return node;
  }
  return document.createTextNode(String(node));
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

export function setAttribute(element: Element, attr: string, value: any): void {
  if (isFalsy(value)) {
    element.removeAttribute(attr);
  } else if (value === true) {
    element.setAttribute(attr, '');
  } else {
    element.setAttribute(attr, value);
  }
}

export function mapNodeTree(
  tree: Node,
  options?: { skipRoot?: boolean }
): Record<number, Node> {
  const { skipRoot = false } = options ?? {};
  let index = skipRoot ? -1 : 0;
  const result: Record<number, Node> = {};
  const walk = (node: Node) => {
    result[index++] = node;
    let child = node.firstChild;
    while (child) {
      walk(child);
      child = child.nextSibling;
    }
  };
  walk(tree);
  delete result[-1];
  return result;
}

export function template(html: string): DocumentFragment {
  const template = document.createElement('template');
  template.innerHTML = html;
  return template.content;
}
