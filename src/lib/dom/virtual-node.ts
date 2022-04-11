import { Attrs, Classes, Key, Props, vnode, VNode, VNodeStyle } from 'snabbdom';
import { Component, ObservableState } from '../core';
import { ComponentRef } from './component-ref';

export type Ref = ((el: HTMLElement) => void) | ObservableState<HTMLElement>;

export interface AttributeData {
  attrs: Attrs;
  class: Classes;
  key: Key | undefined;
  props: Props;
  ref: Ref | undefined;
  style: VNodeStyle;
}

export interface VirtualNode extends VNode {
  data: AttributeData;
  children: VirtualNode[];
  Component?: Component;
  ref?: ComponentRef;
}

export function createVirtualNode(): VirtualNode;
export function createVirtualNode(text: string): VirtualNode;
export function createVirtualNode(
  element: string | Component,
  data: AttributeData,
  children: VirtualNode[]
): VirtualNode;
export function createVirtualNode(
  element?: string | Component,
  data?: AttributeData,
  children?: VirtualNode[]
): VirtualNode {
  if (!data && !children) {
    return vnode(
      undefined,
      {},
      element ? undefined : [],
      element as string,
      undefined
    ) as VirtualNode;
  }

  if (typeof element === 'string') {
    return vnode(element, data, children, undefined, undefined) as VirtualNode;
  }

  const node = vnode(
    undefined,
    data,
    children,
    undefined,
    undefined
  ) as VirtualNode;
  node.Component = element;
  return node;
}
