import { Component, ComponentRef, ObservableState } from '../../core';

export interface VData {
  key?: string | number;
  props?: { [key: string]: any };
  ref?: ObservableState<Node> | ((ref: Node) => void);
}

export class VirtualNode {
  Component?: Component;
  content?: string;
  ref?: ComponentRef;
  node: Text | Element | DocumentFragment | undefined;

  constructor(
    readonly type: string,
    readonly data: VData,
    readonly children: VirtualNode[]
  ) {}

  getNode(): Node | undefined {
    let node = this.node;
    while (node instanceof DocumentFragment) {
      node = (node as any).stepfather;
    }
    return node;
  }

  getParent(): Node | undefined {
    let node = this.node?.parentNode ?? this.node;
    while (node instanceof DocumentFragment) {
      node = (node as any).stepfather;
    }
    return node;
  }
}
