import { nodeApi } from './virtual-dom/node-api';
import { patch } from './virtual-dom/patch';
import { VirtualNode } from './virtual-node';

const NODE_STORE = new WeakMap<Element, VirtualNode>();

export function render(node: JSX.Element, parent: Element): void {
  const oldNode = NODE_STORE.get(parent);
  if (oldNode) {
    patch(oldNode, node as VirtualNode);
  } else {
    const element = nodeApi.createElement(node as VirtualNode);
    parent.appendChild(element);
  }
  NODE_STORE.set(parent, node as VirtualNode);
}
