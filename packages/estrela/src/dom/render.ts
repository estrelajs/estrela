import { VirtualNode } from './virtual-dom/virtual-node';

export function render(node: JSX.Element, parent: Element): void {
  const element = (node as VirtualNode).createElement();
  parent.appendChild(element);
}
