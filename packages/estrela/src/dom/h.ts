import { Component, isObservable, createSelector } from '../core';
import { apply, coerceArray, isTruthy } from '../utils';
import { buildData } from './virtual-dom/data-builder';
import { VirtualNode } from './virtual-node';

export function h(): VirtualNode;
export function h(sel: Node): VirtualNode;
export function h(sel: '#' | '!', data: null, text: string): VirtualNode;
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
      text: children[0] as string,
    };
  }
  if (sel instanceof Node) {
    return node2vnode(sel);
  }

  const vchildren = children.flatMap(child => {
    // create selector
    if (Array.isArray(child) && typeof child.at(-1) === 'function') {
      const inputs = child.slice(0, -1) as any[];
      const states = inputs.filter(isObservable);
      const selectorFn = child.at(-1) as any;

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
      .map(c => {
        if (isObservable(c)) {
          return {
            sel: null,
            observable: c,
          } as VirtualNode;
        }
        if (c instanceof Node) {
          return node2vnode(c);
        }
        if (typeof c === 'object') {
          return c as unknown as VirtualNode;
        }
        return h('#text', null, String(c));
      });
  });

  const node: VirtualNode = {
    sel: null,
    children: vchildren,
    data: buildData(data ?? {}, typeof sel === 'function'),
  };

  if (typeof sel === 'string') {
    node.sel = sel;
  } else if (sel) {
    node.Component = sel;
  }

  if (!node.sel && !node.children?.length) {
    node.children = [h('#text', null, '')];
  }

  return node;
}

function node2vnode(node: Node): VirtualNode {
  if (node.nodeType === Node.TEXT_NODE) {
    return {
      sel: '#text',
      text: node.textContent,
    };
  }
  if (node.nodeType === Node.COMMENT_NODE) {
    return {
      sel: '#comment',
      text: node.textContent,
    };
  }
  const children = Array.from(node.childNodes ?? []).map(node2vnode);
  if (node.nodeType === Node.ELEMENT_NODE) {
    return {
      sel: node.nodeName.toLowerCase(),
      children,
      element: node,
    };
  }
  return {
    sel: null,
    children,
    element: node,
  };
}
