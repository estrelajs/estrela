import { VirtualNode } from './internal';

export function render(template: VirtualNode, parent: Element): Node {
  if (!parent) {
    throw new Error('Parent element is not defined');
  }
  return template.mount(parent);
}
