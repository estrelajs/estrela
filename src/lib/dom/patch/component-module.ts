import { Module } from 'snabbdom';
import { ComponentRef } from '../component-ref';
import { VirtualNode } from '../virtual-node';

function componentPatch(oldVNode: VirtualNode, vNode?: VirtualNode): void {
  if (vNode?.Component) {
    vNode.ref =
      oldVNode.ref ?? ComponentRef.createRef(vNode.Component, vNode.data);
    vNode.children ??= [];
    vNode.ref.patchData(vNode.data);
    vNode.ref.patchChildren(vNode.children);
  } else if (oldVNode.Component) {
    oldVNode.ref?.dispose();
  }
}

export const componentModule: Module = {
  create: componentPatch as any,
  update: componentPatch as any,
  destroy: componentPatch as any,
};
