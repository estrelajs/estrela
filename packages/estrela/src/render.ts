import { VirtualNode } from './internal';

/**
 * Mount the root template on the given element.
 *
 * @param template JSX Template
 * @param parent parent element to mount the template
 * @param context optional context to pass to the template
 * @returns mounted nodes
 */
export function render(
  template: VirtualNode,
  parent: Element,
  context = {}
): Node[] {
  if (!parent) {
    throw new Error('Parent element is not defined');
  }
  template.context = context;
  return template.mount(parent);
}
