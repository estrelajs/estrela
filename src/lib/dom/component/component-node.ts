import { fragment, VNode, VNodeChildren, VNodeData } from 'snabbdom';
import { Component } from '../../core';
import { ComponentRef } from './component-ref';

export interface ComponentNode extends VNode {
  Component: Component;
  ref?: ComponentRef;
}

export function createComponentNode(
  Component: Component,
  props: VNodeData,
  children: VNodeChildren = []
): ComponentNode {
  const node = fragment(children) as ComponentNode;
  node.Component = Component;
  node.data = props;
  return node;
}

export function isComponentNode(x: any): x is ComponentNode {
  return typeof x?.Component === 'function';
}
