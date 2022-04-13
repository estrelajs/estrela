import {
  Attrs,
  Classes,
  Key,
  Props,
  vnode,
  VNode,
  VNodeStyle,
} from '@estrelajs/snabbdom';
import { Component, EventEmitter, ObservableState } from '../core';
import { ComponentRef } from './component-ref';

export type Ref = ((el: HTMLElement) => void) | ObservableState<HTMLElement>;

export type AttrEvents = Record<
  string,
  {
    accessor?: string;
    filters: string[];
    handler: (e: any) => void | EventEmitter<any> | ObservableState<any>;
  }
>;

export interface VirtualNodeData {
  attrs: Attrs;
  binds: Props;
  class: Classes;
  events: AttrEvents;
  key: Key | undefined;
  props: Props;
  ref: Ref | undefined;
  slot: string | undefined;
  style: VNodeStyle;
}

export interface VirtualNode extends VNode {
  data: VirtualNodeData;
  children: VirtualNode[];
  Component?: Component;
  listener?: (e: Event) => void;
  ref?: ComponentRef;
}

export function createVirtualNode(): VirtualNode;
export function createVirtualNode(text: string): VirtualNode;
export function createVirtualNode(
  element: string | Component,
  data: VirtualNodeData,
  children: VirtualNode[]
): VirtualNode;
export function createVirtualNode(
  element?: string | Component,
  data?: VirtualNodeData,
  children?: VirtualNode[]
): VirtualNode {
  if (!data && !children) {
    return vnode(
      undefined,
      {},
      typeof element === 'string' ? undefined : [],
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
