import { coerceArray } from './utils';

export function render(nodes: Node | Node[], parent: Element): void {
  coerceArray(nodes).forEach(child => parent.appendChild(child));
}
