import { Component } from '../core';
import {
  createVirtualNode,
  VirtualNode,
  VirtualNodeData,
} from './virtual-node';

export function jsx(
  elem: string | Component | undefined,
  data: VirtualNodeData | null,
  ...children: VirtualNode[]
): VirtualNode {
  const { class: klass, key, ref, slot, style, ...props } = data ?? {};

  data = {
    attrs: {},
    binds: {},
    class: klass ?? {},
    events: {},
    key,
    ref,
    slot,
    style: style ?? {},
    props,
  };

  children = children.map(child => {
    if (typeof child === 'string') {
      return createVirtualNode(child);
    }
    return child;
  });

  return createVirtualNode(elem as any, data, children);
}
