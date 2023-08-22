import { EstrelaComponent } from '../types';
import { EstrelaElement } from './estrela-element';
import { insertChild } from './node-api';

export class EstrelaTemplate {
  static ref: EstrelaTemplate | null = null;

  constructor(
    public readonly template: EstrelaComponent | HTMLTemplateElement,
    public readonly props: Record<string, unknown>,
    public readonly id?: string
  ) {}

  mount(parent: Node, before: Node | null = null): EstrelaElement {
    if (this.template instanceof HTMLTemplateElement) {
      return this.mountTemplate(this.template, parent, before);
    }
    return this.mountComponent(this.template, parent, before);
  }

  private mountComponent(
    component: EstrelaComponent,
    parent: Node,
    before: Node | null = null
  ): EstrelaElement {
    EstrelaTemplate.ref = this;
    const template = component(this.props);
    EstrelaTemplate.ref = null;
    return template.mount(parent, before);
  }

  private mountTemplate(
    template: HTMLTemplateElement,
    parent: Node,
    before: Node | null = null
  ): EstrelaElement {
    const clone = template.content.cloneNode(true);
    const firstChild = clone.firstChild as HTMLElement | null;

    // Remove tags with _tmpl_ attribute.
    // This is a workaround for svg templates.
    if (firstChild?.hasAttribute?.('_tmpl_')) {
      clone.removeChild(firstChild);
      Array.from(firstChild.childNodes).forEach(child =>
        clone.appendChild(child)
      );
    }

    const nodes = Array.from(clone.childNodes);
    const tree = createNodeTree(parent, clone, this.id);
    const instance = new EstrelaElement(nodes, tree, this);

    insertChild(parent, clone, before);
    instance.patchProps(this.props);
    return instance;
  }
}

function createNodeTree(
  parent: Node,
  tree: Node,
  styleId?: string
): Map<number, Node> {
  const nodeTree = new Map<number, Node>();
  nodeTree.set(0, parent);
  let index = 1;
  const walk = (node: Node) => {
    if (node.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) {
      nodeTree.set(index++, node);
    }
    let child = node.firstChild;
    while (child) {
      walk(child);
      child = child.nextSibling;
    }
    if (styleId) {
      (node as Element).setAttribute?.(`_${styleId}`, '');
    }
  };
  walk(tree);
  return nodeTree;
}
