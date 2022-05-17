import {
  coerceObservable,
  createSelector,
  isObservable,
  isPromise,
  Observable,
} from '../observables';
import { Component } from '../types';
import { createComponent } from './component';
import { diffNodes, MoveType } from './diff-nodes';
import { NODE_DATA_MAP } from './node-map';
import { buildData } from './virtual-dom/data-builder';

export function h(
  kind: string | Component | null = null,
  data: string | Record<string, any> | null = null,
  ...children: any[]
): Node | Node[] | null {
  let element: Node;
  if (kind === '#') {
    kind = '#text';
  }
  if (kind === '!') {
    kind = '#comment';
  }
  if (kind === '#text') {
    element = document.createTextNode(data as string);
  } else if (kind === '#comment') {
    element = document.createComment(data as string);
  } else if (typeof kind === 'string') {
    element = document.createElement(kind);
  } else if (typeof kind === 'function') {
    return createComponent(kind, data as any, children);
  } else {
    return children.flatMap(createElement);
  }
  if (data && typeof data === 'object') {
    const nodeData = buildData(data, false);
    NODE_DATA_MAP.set(element, nodeData);
  }
  children.flatMap(createElement).forEach(child => {
    element.appendChild(child);
  });
  return element;
}

function createElement(data: any): Node | Node[] {
  if (data instanceof Node) {
    return data;
  }
  if (typeof data === 'function') {
    const selector = createSelector(data);
    return handleObservable(selector);
  }
  if (Array.isArray(data)) {
    return data.flatMap(createElement);
  }
  if (isObservable(data) || isPromise(data)) {
    return handleObservable(data);
  }
  return document.createTextNode(data);
}

function handleObservable(obj: Observable<any> | Promise<any>): Node[] {
  let nodes: Node[] = [];
  const subscription = coerceObservable(obj).subscribe(
    value => {
      if (nodes[0]?.parentElement === null) {
        subscription.unsubscribe();
        return;
      }
      nodes = patchNodes(nodes, value);
    },
    { initialEmit: true }
  );
  return nodes;
}

function patchNodes(nodes: Node[], data: any): Node[] {
  const firstChild = nodes[0];
  const parent = firstChild?.parentElement;
  const newNodes = [createElement(data)].flat();

  if (newNodes.length === 0) {
    newNodes.push(document.createTextNode(''));
  }

  if (parent) {
    const children = Array.from(parent.childNodes) as Node[];
    const startIndex = children.indexOf(firstChild);
    const diff = diffNodes(nodes, newNodes);

    for (let i = 0; i < nodes.length; i++) {
      const child = nodes[i];
      const newChild = diff.children[i];
      if (child && newChild) {
        patchNode(child, newChild);
      }
    }

    diff.moves.forEach(move => {
      if (move.type === MoveType.Remove) {
        parent.removeChild(move.item);
      }
      if (move.type === MoveType.Insert) {
        // if (meta.isFragment) {
        //   parent = meta.parent ?? meta.element;
        //   move.index += meta.childIndex;
        // }
        const oldChild = parent.childNodes[move.index];
        parent.insertBefore(move.item, oldChild);
      }
    });

    return Array.from(parent.childNodes).slice(
      startIndex,
      startIndex + newNodes.length
    );
  }

  return newNodes;
}

function patchNode(node: Node, newNode: Node): Node {
  if (node.nodeType === newNode.nodeType) {
    // hooks.forEach(hook => hook.update?.(node, newNode));

    if (
      node.nodeType === Node.TEXT_NODE ||
      node.nodeType === Node.COMMENT_NODE
    ) {
      if (node.textContent !== newNode.textContent) {
        node.textContent = newNode.textContent;
      }
    }
    // else {
    //   patchChildren(node, newNode);
    // }
    return node;
  }
  node.parentNode?.replaceChild(newNode, node);
  return newNode;
}
