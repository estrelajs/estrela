import { nodeApi } from './virtual-dom/node-api';
import { patch } from './virtual-dom/patch';
import { VirtualNode } from './virtual-node';

const NODE_STORE = new WeakMap<Element, VirtualNode>();

export function render(node: JSX.Element, element: Element): void {
  const oldNode = NODE_STORE.get(element);
  if (oldNode) {
    patch(oldNode, node as VirtualNode);
  } else {
    element.appendChild(nodeApi.createElement(node as VirtualNode));
  }
  NODE_STORE.set(element, node as VirtualNode);
}
