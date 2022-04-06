import { create, diff, patch } from 'virtual-dom';
import VText from 'virtual-dom/vnode/vtext';

import { HTMLTemplate } from './html';
import { buildAst } from './processor/ast-builder';
import { buildHTMLTemplate } from './processor/template-builder';
import { buildVTree } from './processor/vtree-builder';

const TREE_STORE = new WeakMap<Element, VirtualDOM.VTree>();

export function render(template: HTMLTemplate, element: Element): void {
  const rawHtml = buildHTMLTemplate(template);
  const ast = buildAst(rawHtml);
  const newTree = buildVTree(ast);

  const tree = TREE_STORE.get(element);
  TREE_STORE.set(element, newTree);

  if (tree) {
    const patches = diff(tree, newTree);
    patch(element, patches);
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
