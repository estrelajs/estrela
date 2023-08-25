import { getActiveEffectMetadata, untrack } from '../signal/effect';
import { signalStore, withState } from '../store';
import { EstrelaComponent, Output, Signal } from '../types';
import { apply } from '../utils';
import { EstrelaElement } from './estrela-element';
import { insertChild } from './node-api';
import { HookContext } from './types';

export class EstrelaTemplate {
  static context: Record<symbol, Signal<unknown>> = {};
  static hookContext: HookContext | null = null;
  private styleId?: string;

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
    const [props, setProps] = signalStore(withState(this.props));
    const proxyProps = new Proxy(props, {
      get(target, key: string) {
        const eventKey = `on:${key}`;
        if (target[eventKey]) {
          const listener = untrack(() => target[eventKey]()) as Function;
          const emitter: Output<unknown> = function () {
            const metadata = getActiveEffectMetadata();
            if (
              !metadata ||
              metadata.options.allowEmitsOnFirstRun ||
              metadata.iteration > 0
            ) {
              listener.apply(undefined, arguments);
            }
          };
          emitter.type = 'output';
          return emitter;
        }
        return apply(apply(target[key]));
      },
    });

    EstrelaTemplate.context = { ...EstrelaTemplate.context };
    EstrelaTemplate.hookContext = { destroy: [], init: [] };

    const hook = EstrelaTemplate.hookContext;
    const template: EstrelaTemplate = untrack(() =>
      component.call(proxyProps, proxyProps)
    );
    if (component.hasOwnProperty('styleId')) {
      template.styleId = (component as any)['styleId'];
    }

    EstrelaTemplate.hookContext = null;

    const instance = template.mount(parent, before);
    hook.init.forEach(cb => cb());
    instance.setProps = setProps;
    instance.track.set('_destroy$', {
      cleanup: () => hook.destroy.forEach(cb => cb()),
    });

    return instance;
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
    const tree = createNodeTree(parent, clone, this.styleId);
    const instance = new EstrelaElement(nodes, tree, before);

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
