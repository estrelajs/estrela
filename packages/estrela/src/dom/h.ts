import { Component, isSubscribable, isPromise } from '../core';
import { createSelector } from '../store';
import { apply, coerceArray, isTruthy } from '../utils';
import { buildData } from './virtual-dom/data-builder';
import { domApi } from './domapi';
import { VirtualNode } from './virtual-dom/virtual-node';

export function h(): VirtualNode;
export function h(sel: Node): VirtualNode;
export function h(
  sel: '#' | '!',
  data?: null,
  text?: string | null
): VirtualNode;
export function h(
  sel: string | Component | null,
  data: Record<string, any> | null,
  ...children: JSX.Children[]
): VirtualNode;
export function h(
  sel: string | Component | Node | null = null,
  data: Record<string, any> | null = null,
  ...children: JSX.Children[]
): VirtualNode {
  if (sel === '#') {
    sel = '#text';
  }
  if (sel === '!') {
    sel = '#comment';
  }
  if (sel === '#text' || sel === '!#comment') {
    return new VirtualNode({
      sel: sel,
      text: (children[0] as string) ?? null,
    });
  }
  if (sel instanceof Node) {
    return node2vnode(sel);
  }

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
          if (!node.sel && !node.Component && !node.observable) {
            return node.children ?? [];
          }
          return node;
        }
        return h('#text', null, String(c));
      });
  });

  if (typeof sel === 'function') {
    return new VirtualNode({
      Component: sel,
      data: buildData(data ?? {}, true),
      children: vchildren,
    });
  } else if (sel) {
    return new VirtualNode({
      sel,
      data: buildData(data ?? {}, false),
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
      sel: '#text',
      text: node.textContent,
      element: node,
    });
  }
  if (domApi.isComment(node)) {
    return new VirtualNode({
      sel: '#comment',
      text: node.textContent,
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
    sel: node.nodeName.toLowerCase(),
    children,
    element: node,
  });
}
