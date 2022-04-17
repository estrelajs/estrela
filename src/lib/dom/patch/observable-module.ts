import { Module } from '@estrelajs/snabbdom';
import { VirtualNode } from '../virtual-node';

function observablePatch(oldVNode: VirtualNode, vNode?: VirtualNode): void {}

export const observableModule: Module = {
  create: observablePatch as any,
  update: observablePatch as any,
};
