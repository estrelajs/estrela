import { Component } from '../../core';
import { VData, VirtualNode } from './virtual-node';
import { VElement, VNode, VComponent, VFragment, VText } from './vnode';

export function h(type: string): VElement;
export function h(type: string, children: VNode[]): VElement;
export function h(type: string, data: VData, children: VNode[]): VElement;
export function h(Component: Component): VComponent;
export function h(Component: Component, data: VData): VComponent;
export function h(
  type: string | Component,
  data: VData | VNode[] | undefined = {},
  children: VNode[] | undefined = []
): any {
  let Component: Component | undefined;
  if (typeof type === 'function') {
    Component = type;
    type = 'fragment';
  }
  if (Array.isArray(data)) {
    children = data;
    data = {};
  }
  const node = new VirtualNode(type, data, children as any);
  if (Component) {
    node.Component = Component;
  }
  return node;
}

export function f(children: VNode[]): VFragment {
  return new VirtualNode('fragment', {}, children as any) as any;
}

export function t(content: string): VText {
  const node = new VirtualNode('text', {}, []);
  node.content = content;
  return node as any;
}
