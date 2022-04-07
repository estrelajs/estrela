import { create, diff, patch } from 'virtual-dom';
import VText from 'virtual-dom/vnode/vtext';
import { HTMLTemplate } from './html';
import { createTree } from './processor/create-tree';

const TREE_STORE = new WeakMap<Element | DocumentFragment, VirtualDOM.VTree>();

export function render(
  template: HTMLTemplate,
  element: Element | DocumentFragment
): void {
  const newTree = createTree(template);
  const tree = TREE_STORE.get(element);
  TREE_STORE.set(element, newTree);

  if (tree) {
    const patches = diff(tree, newTree);
    patch(element as Element, patches);
  } else {
    newTree.children.forEach(node => {
      const child =
        node instanceof VText
          ? document.createTextNode(node.text)
          : create(node);
      element.appendChild(child);
    });
  }
}
