import { Key } from '../types/types';
import { insertChild, removeChild, replaceChild } from './node-api';
import { VirtualNode } from './virtual-node';

type NodeOrVNode = Node | VirtualNode;

export function patchChildren(
  parent: Node,
  childrenMap: Map<Key, NodeOrVNode>,
  nextChildren: NodeOrVNode[],
  before: Node | null
): Map<Key, NodeOrVNode> {
  const result = new Map<Key, NodeOrVNode>();
  const children = childrenMap.values();

  if (childrenMap.size > 0 && nextChildren.length === 0) {
    if (parent.childNodes.length === childrenMap.size + (before ? 1 : 0)) {
      (parent as Element).innerHTML = '';
      if (before) {
        insertChild(parent, before);
      }
    } else {
      const range = document.createRange();
      const child = children.next().value;
      const start = child instanceof VirtualNode ? child.firstChild : child;
      range.setStartBefore(start);
      if (before) {
        range.setEndBefore(before);
      } else {
        range.setEndAfter(parent);
      }
      range.deleteContents();
    }
    childrenMap.forEach(node => {
      if (node instanceof VirtualNode) {
        node.dispose();
      }
    });
    return result;
  }

  const replaces: [Comment, NodeOrVNode][] = [];
  const nextChildrenMap = mapKeys(nextChildren);

  for (let i = 0; i < nextChildren.length; i++) {
    let currChild = children.next().value;
    let currKey = getKey(currChild, i);

    while (currChild && !nextChildrenMap.has(currKey)) {
      removeChild(parent, currChild);
      childrenMap.delete(currKey);
      currChild = children.next().value;
      currKey = getKey(currChild, i);
    }

    let child = nextChildren[i];
    const key = getKey(child, i);
    const origChild = childrenMap.get(key);

    if (currChild || origChild) {
      if (currChild === origChild) {
        child = patch(parent, currChild, child);
      } else if (currChild) {
        if (origChild) {
          child = patch(parent, origChild, child);
        }
        const placeholder = document.createComment('');
        insertChild(parent, placeholder, currChild);
        replaces.push([placeholder, child]);
      } else {
        insertChild(parent, child, before);
      }
    } else {
      insertChild(parent, child, before);
    }

    result.set(key, child);
    // childrenMap.delete(key);
  }

  replaces.forEach(([placeholder, child]) =>
    replaceChild(parent, child, placeholder)
  );

  childrenMap.forEach((child, key) => {
    if (!result.has(key)) {
      removeChild(parent, child);
    }
  });

  return result;
}

function patch(
  parent: Node,
  node: NodeOrVNode,
  next: NodeOrVNode
): NodeOrVNode {
  if (node === next) {
    return node;
  }
  if (node instanceof VirtualNode && next instanceof VirtualNode) {
    if (node.template === next.template) {
      node.patch(next.data);
      return node;
    }
  }
  if (node instanceof Text && next instanceof Text) {
    if (node.textContent !== next.textContent) {
      node.textContent = next.textContent;
    }
    return node;
  }
  replaceChild(parent, next, node);
  return next;
}

function mapKeys(children: NodeOrVNode[]): Map<Key, NodeOrVNode> {
  const result = new Map<Key, NodeOrVNode>();
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    const key = getKey(child, i);
    result.set(key, child);
  }
  return result;
}

function getKey(node: NodeOrVNode | undefined, index: number): Key {
  const key = (node as any)?.id;
  let result = key === '' ? undefined : key;
  return result ?? `_$${index}$`;
}
