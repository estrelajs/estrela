import { create, diff, patch } from 'virtual-dom';
import VText from 'virtual-dom/vnode/vtext';
import VNode from 'virtual-dom/vnode/vnode';
import walk from 'dom-walk';

import { HTMLTemplate } from '../html';
import { ElementProps } from './ast-builder';
import { createTree } from './create-tree';

export class Widget implements VirtualDOM.Widget {
  readonly type = 'Widget';
  tree!: VirtualDOM.VNode;

  constructor(
    readonly Component: (props: ElementProps) => HTMLTemplate,
    readonly props: ElementProps
  ) {}

  init(): Element {
    const fragment = document.createDocumentFragment();
    this.tree = createTree(this.Component(this.props));
    this.tree.children.forEach(node => {
      const child =
        node instanceof VText
          ? document.createTextNode(node.text)
          : create(node);
      fragment.appendChild(child);
    });
    return fragment.cloneNode(true) as Element;
  }

  update(previous: Widget, element: Element): void {
    this.tree = createTree(this.Component(this.props));
    const patches = this.shiftPatches(element, diff(previous.tree, this.tree));
    patch(element.parentElement!, patches);
  }

  destroy(node: Element): void {}

  private shiftPatches(
    element: Element,
    patches: VirtualDOM.VPatch[]
  ): VirtualDOM.VPatch[] {
    let shift = 0;
    let found = false;
    walk(element.parentElement!.childNodes, node => {
      if (node === element) {
        found = true;
      }
      if (!found) {
        shift++;
      }
    });
    if (shift > 0) {
      Object.keys(patches)
        .reverse()
        .forEach(key => {
          const index = Number(key);
          if (!Number.isNaN(index)) {
            patches[index + shift] = patches[index];
            delete patches[index];
          }
        });
      (patches as any)['a'] = this.createParentVTree(element.parentElement!);
    }
    return patches;
  }

  private createParentVTree(element: Element): VirtualDOM.VNode {
    const children = Array.from(element.childNodes).map(node => {
      if (node instanceof Text) {
        return new VText(node.textContent ?? '');
      }
      return this.createParentVTree(node as Element);
    });
    return new VNode(element.tagName, {}, children);
  }
}
