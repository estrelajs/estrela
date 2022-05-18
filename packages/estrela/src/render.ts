import { domApi } from './internal/domapi';
import { coerceArray } from './utils';

export function render(nodes: JSX.Element, parent: Element): void {
  coerceArray(nodes).forEach(child => parent.appendChild(child));
}
