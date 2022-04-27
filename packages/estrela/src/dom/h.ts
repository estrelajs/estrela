import { Component, isObservable, createSelector, isPromise } from '../core';
import { apply, coerceArray, isTruthy } from '../utils';
import { buildData } from './virtual-dom/data-builder';
import { nodeApi } from './virtual-dom/node-api';
import { VirtualNode } from './virtual-node';

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
  ...children: JSX.ArrayElement
): VirtualNode;
export function h(
  sel: string | Component | Node | null = null,
  data: Record<string, any> | null = null,
  ...children: JSX.ArrayElement
): VirtualNode {
  if (sel === '#') {
    sel = '#text';
  }
  if (sel === '!') {
    sel = '#comment';
  }
  if (sel === '#text' || sel === '!#comment') {
    return {
      sel: sel,
      text: (children[0] as string) ?? null,
    };
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
        input => isPromise(input) || isObservable(input)
      );

      if (states.length === 0) {
        child = selectorFn(...inputs.map(apply));
      } else {
        child = createSelector(...states, (...args: any): any => {
          let index = 0;
          return selectorFn(
            ...inputs.map(arg => (isObservable(arg) ? args[index++] : arg()))
          );
        });
      }
    }

    // parse each child
    return coerceArray(child)
      .filter(isTruthy)
      .flatMap(c => {
        if (isPromise(c) || isObservable(c)) {
          return { observable: c };
        }
        if (c instanceof Node) {
          return node2vnode(c);
        }
        if (typeof c === 'object') {
          const node = c as VirtualNode;
          if (!node.sel && !node.Component && !node.observable) {
            return node.children ?? [];
          }
          return node;
        }
        return h('#text', null, String(c));
      });
  });

  if (typeof sel === 'function') {
    return {
      Component: sel,
      data: buildData(data ?? {}, true),
      children: vchildren,
    };
  } else if (sel) {
    return {
      sel,
      data: buildData(data ?? {}, true),
      children: vchildren,
    };
  }
  return {
    children: vchildren.length === 0 ? [h('#')] : vchildren,
  };
}

function node2vnode(node: Node): VirtualNode {
  if (nodeApi.isText(node)) {
    return {
      sel: '#text',
      text: node.textContent,
      element: node,
    };
  }
  if (nodeApi.isComment(node)) {
    return {
      sel: '#comment',
      text: node.textContent,
      element: node,
    };
  }
  const children = Array.from(node.childNodes ?? []).map(node2vnode);
  if (nodeApi.isDocumentFragment(node)) {
    return {
      children,
      element: node,
    };
  }
  return {
    sel: node.nodeName.toLowerCase(),
    children,
    element: node,
  };
}
