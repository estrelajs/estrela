import { nodeApi } from './virtual-dom/node-api';
import { VirtualNode } from './virtual-node';

export function render(node: JSX.Element, parent: Element): void {
  const element = nodeApi.createElement(node as VirtualNode);
  parent.appendChild(element);
}
