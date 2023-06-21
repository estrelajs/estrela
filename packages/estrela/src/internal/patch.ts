import { EstrelaNode, isEstrelaNode } from './template';
import { insertChild, removeChild, replaceChild } from './node-api';

type AnyNode = Node | EstrelaNode;

export function patchChildren(
  parent: Node,
  childrenMap: Map<string, AnyNode>,
  nextChildren: AnyNode[],
  before: Node | null
): Map<string, AnyNode> {
  const result = new Map<string, AnyNode>();
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
      const start = isEstrelaNode(child) ? child.firstChild : child;
      range.setStartBefore(start);
      if (before) {
        range.setEndBefore(before);
      } else {
        range.setEndAfter(parent);
      }
      range.deleteContents();
    }
    childrenMap.forEach(node => {
      if (isEstrelaNode(node)) {
        node.unmount();
      }
    });
    return result;
  }

  const replaces: [Comment, AnyNode][] = [];
  const nextChildrenMap = mapKeys(nextChildren);

  for (let i = 0; i < nextChildren.length; i++) {
    let currChild = children.next().value;
    let currKey = getKey(currChild, i);

    while (currChild && !nextChildrenMap.has(currKey)) {
      removeChild(currChild);
      childrenMap.delete(currKey);
      currChild = children.next().value;
      currKey = getKey(currChild, i);
    }

    let child = nextChildren[i];
    const key = getKey(child, i);
    const origChild = childrenMap.get(key);

    if (origChild) {
      child = patch(parent, origChild, child);
    }

    if (currChild) {
      if (currChild === origChild) {
        // noop
      } else if (currChild) {
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
  }

  replaces.forEach(([placeholder, child]) =>
    replaceChild(parent, child, placeholder)
  );

  childrenMap.forEach((child, key) => {
    if (child.isConnected && !result.has(key)) {
      removeChild(child);
    }
  });

  return result;
}

function patch(parent: Node, node: AnyNode, next: AnyNode): AnyNode {
  if (node === next) {
    return node;
  }
  if (isEstrelaNode(node) && isEstrelaNode(next)) {
    if (node.template === next.template) {
      node.patchProps(next.props);
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

function mapKeys(children: AnyNode[]): Map<string, AnyNode> {
  const result = new Map<string, AnyNode>();
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    const key = getKey(child, i);
    result.set(key, child);
  }
  return result;
}

function getKey(node: AnyNode | undefined, index: number): string {
  const key = (node as any)?.id;
  let result = key === '' ? undefined : key;
  return result ?? `_$${index}$`;
}
