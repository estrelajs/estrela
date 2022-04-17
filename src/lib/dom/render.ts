import { buildTemplate } from './builders/template-builder';
import { HTMLTemplate } from './html';
import { VirtualNode } from './virtual-node';
import { patch } from './patch';

const TEMPLATE_STORE = new WeakMap<Node, VirtualNode>();

export function render(
  template: HTMLTemplate | VirtualNode,
  parent: Node
): void {
  const tree = TEMPLATE_STORE.get(parent);
  const newTree =
    template instanceof HTMLTemplate ? buildTemplate(template) : template;

  if (tree) {
    patch(tree, newTree);
  } else {
    const div = document.createElement('div');
    parent.appendChild(div);
    patch(div, newTree);
  }

  TEMPLATE_STORE.set(parent, newTree);
}
