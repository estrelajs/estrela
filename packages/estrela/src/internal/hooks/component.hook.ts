import { ComponentRef } from '../virtual-dom/component-ref';
import { VirtualNode } from '../virtual-dom/virtual-node';
import { Hook } from './Hook';

export const componentHook: Hook = {
  create: hook,
  update: hook,
  remove: hook,
};

function hook(oldNode: VirtualNode, node?: VirtualNode): void {
  const isComponent = typeof node?.kind === 'function';
  if (oldNode.kind !== node?.kind) {
    oldNode.componentRef?.dispose();
    if (isComponent) {
      node.componentRef = new ComponentRef(node);
    }
  } else if (isComponent) {
    node.componentRef = oldNode.componentRef;
    node.componentRef?.patch(oldNode, node);
  }
}
