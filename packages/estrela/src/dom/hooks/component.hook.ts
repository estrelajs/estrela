import { ComponentRef } from '../virtual-dom/component-ref';
import { VirtualNode } from '../virtual-node';
import { Hook } from './types';

function hook(oldNode: VirtualNode, node?: VirtualNode): void {
  if (oldNode.Component !== node?.Component) {
    oldNode.componentRef?.dispose();
    delete oldNode.componentRef;
  }
  if (node?.Component) {
    node.componentRef =
      oldNode.componentRef ?? new ComponentRef(node.element as Element);
  }
}

export const componentHook: Hook = {
  create: hook,
  update: hook,
  remove: hook,
};
