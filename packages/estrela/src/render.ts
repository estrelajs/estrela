import { nodeApi } from './internal';

export function render(template: JSX.Element, parent: Element): void {
  if (!parent) {
    throw new Error('Parent element is not defined');
  }
  nodeApi.appendChild(parent, template);
}
