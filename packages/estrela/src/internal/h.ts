import { isPromise, isSubscribable } from '../observables';
import { createSelector } from '../store';
import { Component } from '../types';
import { apply, coerceArray, isTruthy } from '../utils';
import { domApi } from './domapi';
import { buildData } from './virtual-dom/data-builder';
import { VirtualNode } from './virtual-dom/virtual-node';

export function h(): VirtualNode;
export function h(kind: Node): VirtualNode;
export function h(kind: '#' | '!', content?: any): VirtualNode;
export function h(
  kind: string | Component | null,
  data: Record<string, any> | null,
  ...children: JSX.Children[]
): VirtualNode;
export function h(
  kind: string | Component | Node | null = null,
  data: string | Record<string, any> | null = null,
  ...children: JSX.Children[]
): VirtualNode {
  if (kind === '#') {
    kind = '#text';
  }
  if (kind === '!') {
    kind = '#comment';
  }
  if (kind === '#text' || kind === '!#comment') {
    return new VirtualNode({
      kind: kind,
      content: data,
    });
  }
  if (kind instanceof Node) {
    return node2vnode(kind);
  }

  data = data as Record<string, any> | null;
  const vchildren = children.flatMap(child => {
    // create selector
    if (Array.isArray(child) && typeof child.at(-1) === 'function') {
      const selectorFn = child.pop() as any;
      const inputs = child as any[];
      const states = inputs.filter(
        input => isPromise(input) || isSubscribable(input)
      );

      if (states.length === 0) {
        child = selectorFn(...inputs.map(apply));
      } else {
        child = createSelector(...states, (...args: any): any => {
          let index = 0;
          return selectorFn(
            ...inputs.map(arg => (isSubscribable(arg) ? args[index++] : arg()))
          );
        });
      }
    }

    // parse each child
    return coerceArray(child)
      .filter(isTruthy)
      .flatMap(c => {
        if (isPromise(c) || isSubscribable(c)) {
          return new VirtualNode({ observable: c });
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
        return h('#', c);
      });
  });

  if (kind) {
    return new VirtualNode({
      kind: kind,
      data: buildData(data ?? {}, typeof kind === 'function'),
      children: vchildren,
    });
  }
  return new VirtualNode({
    children: vchildren.length === 0 ? [h('#')] : vchildren,
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
