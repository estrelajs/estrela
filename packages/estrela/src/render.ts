import { VirtualNode } from './internal';

export function render(template: VirtualNode, parent: Element): void {
  if (!parent) {
    throw new Error('Parent element is not defined');
  }
  template.mount(parent);
}
