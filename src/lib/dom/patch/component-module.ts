import { Module, VNode } from 'snabbdom';
import { ComponentNode, isComponentNode } from '../component/component-node';
import { ComponentRef } from '../component/component-ref';

function componentPatch(oldVNode: VNode, vNode?: VNode): void {
  if (isComponentNode(vNode)) {
    const old = oldVNode as ComponentNode;
    vNode.ref =
      old.ref ??
      ComponentRef.createRef(vNode.Component, vNode.data?.props ?? {});
    vNode.children ??= [];
    vNode.ref.patchProps(vNode.data?.props ?? {});
    vNode.ref.patchChildren(vNode.children);
  } else if (isComponentNode(oldVNode)) {
    oldVNode.ref?.dispose();
  }
}

export const componentModule: Module = {
  create: componentPatch,
  update: componentPatch,
  destroy: componentPatch,
};
