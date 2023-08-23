import { EstrelaElement } from './estrela-element';
import { insertChild, removeChild, replaceChild } from './node-api';

export function patchChildren(
  parent: Node,
  childrenMap: Map<string, Node>,
  nextChildren: Node[],
  before: Node | null
): Map<string, Node> {
  const result = new Map<string, Node>();
  const children = childrenMap.values();

  // if (childrenMap.size > 0 && nextChildren.length === 0) {
  //   if (parent.childNodes.length === childrenMap.size + (before ? 1 : 0)) {
  //     (parent as Element).innerHTML = '';
  //     if (before) {
  //       insertChild(parent, before);
  //     }
  //   } else {
  //     const range = document.createRange();
  //     const child = children.next().value;
  //     const start = child instanceof EstrelaElement ? child.firstChild : child;
  //     range.setStartBefore(start);
  //     if (before) {
  //       range.setEndBefore(before);
  //     } else {
  //       range.setEndAfter(parent);
  //     }
  //     range.deleteContents();
  //   }
  //   childrenMap.forEach(node => {
  //     if (node instanceof EstrelaElement) {
  //       node.unmount();
  //     }
  //   });
  //   return result;
  // }

  const replaces: [Comment, Node][] = [];
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
      child = replaceChild(parent, child, origChild);
    }

    if (currChild) {
      if (currChild === origChild) {
        // noop
      } else if (currChild) {
        const placeholder = document.createComment('');
        insertChild(parent, placeholder, currChild);
        replaces.push([placeholder, child]);
      } else {
        child = insertChild(parent, child, before) as Node;
      }
    } else {
      child = insertChild(parent, child, before) as Node;
    }

    result.set(key, child);
  }

  replaces.forEach(([placeholder, child]) =>
    replaceChild(parent, child, placeholder)
  );

  childrenMap.forEach((child, key) => {
    if (!result.has(key)) {
      // && child.isConnected
      removeChild(child);
    }
  });

  return result;
}

function mapKeys(children: Node[]): Map<string, Node> {
  const result = new Map<string, Node>();
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    const key = getKey(child, i);
    result.set(key, child);
  }
  return result;
}

function getKey(node: Node | undefined, index: number): string {
  const id = (node as Element)?.id;
  let result = id === '' ? undefined : id;
  return result ?? `_$${index}$`;
}
