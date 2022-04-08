import { Component } from '../../core';
import { ComponentRef } from '../component-ref';
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
  set node(node: Text | undefined);
};

export type VFragment = MethodsOf<VirtualNode> & {
  type: 'fragment';
  children: VNode[];
  set node(node: Node | undefined);
};

export type VComponent = VFragment & {
  data: VData;
  Component: Component;
  ref?: ComponentRef;
};

export type VElement = MethodsOf<VirtualNode> & {
  type: string;
  data: VData;
  children: VNode[];
  set node(node: Node | undefined);
};

export type VNode = VComponent | VElement | VFragment | VText;
