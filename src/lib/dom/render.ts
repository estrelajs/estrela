import { VNode } from 'snabbdom';
import { buildTemplate } from './builders/template-builder';
import { HTMLTemplate } from './html';
import { patch } from './patch';

const TEMPLATE_STORE = new WeakMap<Node, VNode>();

export function render(template: HTMLTemplate, parent: Node): void {
  const tree = TEMPLATE_STORE.get(parent);
  const newTree = buildTemplate(template);

  if (tree) {
    patch(tree, newTree);
  } else {
    const div = document.createElement('div');
    parent.appendChild(div);
    patch(div, newTree);
  }

  TEMPLATE_STORE.set(parent, newTree);
}
