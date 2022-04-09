import { Component, ComponentRef } from '../../core';
import { VData, VirtualNode } from './virtual-node';

type MethodsOf<T extends Object> = Pick<
  T,
  {
    [K in keyof T]: T[K] extends Function ? K : never;
  }[keyof T]
>;

export type VText = MethodsOf<VirtualNode> & {
  type: 'text';
  content: string;
  node: Text | undefined;
};

export type VFragment = MethodsOf<VirtualNode> & {
  type: 'fragment';
  children: VNode[];
  node: Node | undefined;
};

export type VComponent = VFragment & {
  data: VData;
  Component: Component;
  ref: ComponentRef | undefined;
};

export type VElement = MethodsOf<VirtualNode> & {
  type: string;
  data: VData;
  children: VNode[];
  node: Node | undefined;
};

export type VNode = VComponent | VElement | VFragment | VText;
