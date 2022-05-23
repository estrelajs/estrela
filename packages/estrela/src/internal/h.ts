import { createSelector, isPromise, isSubscribable } from '../observables';
import { Key } from '../types/data';
import { Component } from '../types/jsx';
import { coerceArray, isTruthy } from '../utils';
import { domApi } from './domapi';
import { buildData } from './virtual-dom/data-builder';
import { VirtualNode } from './virtual-dom/virtual-node';

interface Data {
  [key: string]: any;
  children?: JSX.Children;
}

export function h(): VirtualNode;
export function h(kind: Node): VirtualNode;
export function h(kind: '#' | '!', content?: string): VirtualNode;
export function h(
  kind: string | Component | null,
  data: Data,
  key?: Key
): VirtualNode;
export function h(
  kind: string | Component | Node | null = null,
  data: string | Data = {},
  key?: Key
): VirtualNode {
  if (kind === '#') {
    kind = '#text';
  }
  if (kind === '!') {
    kind = '#comment';
  }
  if (kind === '#text' || kind === '!#comment') {
    const content = typeof data === 'object' ? null : data;
    return new VirtualNode({ kind, content });
  }
  if (kind instanceof Node) {
    return node2vnode(kind);
  }
  if (typeof kind === 'function') {
    return new VirtualNode({
      key,
      kind,
      children: [],
      data: buildData(data as Data, true),
    });
  }

  data = data as Data;
  const children = coerceArray(data.children ?? []).flatMap(child =>
    coerceArray(child)
      .filter(isTruthy)
      .flatMap(c => {
        if (typeof c === 'function') {
          c = createSelector(c);
        }
        if (c instanceof Node) {
          return node2vnode(c);
        }
        if (c instanceof VirtualNode) {
          const node = c.clone();
          if (!node.kind && !node.observable) {
            return node.children ?? [];
          }
          return node;
        }
        if (isPromise(c) || isSubscribable(c)) {
          return new VirtualNode({ observable: c });
        }
        return h('#', String(c));
      })
  );

  if (kind) {
    return new VirtualNode({
      key,
      kind: kind,
      data: buildData(data as Data),
      children,
    });
  }

  return new VirtualNode({
    children: children.length === 0 ? [h('#')] : children,
  });
}

function node2vnode(node: Node): VirtualNode {
  if (domApi.isText(node)) {
    return new VirtualNode({
      kind: '#text',
      content: node.textContent,
      element: node,
    });
  }
  if (domApi.isComment(node)) {
    return new VirtualNode({
      kind: '#comment',
      content: node.textContent,
      element: node,
    });
  }
  const children = Array.from(node.childNodes ?? []).map(node2vnode);
  if (domApi.isDocumentFragment(node)) {
    return new VirtualNode({
      children,
      element: node,
    });
  }
  return new VirtualNode({
    kind: node.nodeName.toLowerCase(),
    children,
    element: node,
  });
}
