import { buildTemplate } from './builders/template-builder';
import { HTMLTemplate } from './html';
import { patch } from './patch';
import { VFragment } from './vnode';

const TEMPLATE_STORE = new WeakMap<Node, VFragment>();

export function render(template: HTMLTemplate, parent: Node): void {
  const tree = TEMPLATE_STORE.get(parent);
  const newTree = buildTemplate(template);
  patch(tree ?? parent, newTree);
  TEMPLATE_STORE.set(parent, newTree);
}
