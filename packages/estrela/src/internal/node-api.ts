import { ComponentNode } from './component-node';
import { nodeHooks } from './hooks';

export const nodeApi = {
  appendChild(parent: Node, child: JSX.Element): void {
    this.insertBefore(parent, child, null);
  },

  insertAfter(
    parent: Node,
    child: JSX.Element,
    after: JSX.Element | null
  ): void {
    const afterNode = after ? this.nextSibling(after) : null;
    this.insertBefore(parent, child, afterNode);
  },

  insertBefore(
    parent: Node,
    child: JSX.Element,
    before: JSX.Element | null
  ): void {
    const beforeNode = before ? this.getFirstNode(before) : null;
    if (child instanceof Node) {
      parent.insertBefore(child, beforeNode);
      nodeHooks.forEach(hook => hook.mount?.(child));
    } else {
      child.mount(parent, beforeNode);
    }
  },

  removeChild(parent: Node, child: JSX.Element): void {
    if (child instanceof Node) {
      parent.removeChild(child);
      nodeHooks.forEach(hook => hook.unmount?.(child));
    } else {
      child.unmount(parent);
    }
  },

  replaceChild(parent: Node, nextChild: JSX.Element, child: JSX.Element): void {
    nodeApi.insertBefore(parent, nextChild, child);
    this.removeChild(parent, child);
  },

  nextSibling(child: JSX.Element): Node | null {
    const childNode = this.getLastNode(child);
    return (childNode?.nextSibling ?? null) as Node | null;
  },

  getFirstNode(node: JSX.Element): Node | null {
    if (node instanceof Node) {
      return node;
    }
    if (node instanceof ComponentNode) {
      return this.getFirstNode(node.children[0]);
    }
    return null;
  },

  getLastNode(node: JSX.Element): Node | null {
    if (node instanceof Node) {
      return node;
    }
    if (node instanceof ComponentNode) {
      return this.getLastNode(node.children.at(-1)!);
    }
    return null;
  },

  isSame(node: JSX.Element, other: JSX.Element): boolean {
    if (node instanceof ComponentNode && other instanceof ComponentNode) {
      return node.component === other.component;
    }
    if (node instanceof Node && other instanceof Node) {
      return node.nodeType === other.nodeType;
    }
    return false;
  },

  isTextElement(node: Node): boolean {
    return (
      node.nodeType === Node.TEXT_NODE || node.nodeType === Node.COMMENT_NODE
    );
  },
};
