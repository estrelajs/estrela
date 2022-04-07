import { create, diff, patch } from 'virtual-dom';
import VText from 'virtual-dom/vnode/vtext';
import VNode from 'virtual-dom/vnode/vnode';
import walk from 'dom-walk';

import { HTMLTemplate } from '../html';
import { ElementProps } from '../processor/ast-builder';
import { createTree } from '../processor/create-tree';
import { ObservableState, state, STATE_STORE } from '../../observable/state';
import { Subscription } from '../../observable';

export class FragmentWidget implements VirtualDOM.Widget {
  readonly type = 'Widget';

  private childNodes: ChildNode[] = [];
  private requestedRender: boolean = false;
  private subscriptions: Subscription[] = [];
  private template!: HTMLTemplate;
  private tree!: VirtualDOM.VNode;

  private observableProps: Record<string, ObservableState<any>> = {};

  constructor(
    readonly Component: (props: ElementProps) => HTMLTemplate,
    readonly props: ElementProps
  ) {}

  init(): Element {
    const fragment = document.createDocumentFragment() as Node;

    // create observable props
    this.updateProps();

    // clear state store
    STATE_STORE.clear();

    // get template
    this.template = this.Component(this.observableProps);

    // observe template states
    STATE_STORE.forEach(state => {
      this.subscriptions.push(
        state.subscribe(() => {
          this.requestRender();
        })
      );
    });

    // create tree
    this.tree = createTree(this.template);
    this.tree.children.forEach(node => {
      const child =
        node instanceof VText
          ? document.createTextNode(node.text)
          : create(node);
      fragment.appendChild(child);
    });

    this.childNodes = Array.from(fragment.childNodes);
    return fragment as Element;
  }

  update(previous: FragmentWidget, element: Element): void {
    // retrieve properties from previous
    this.observableProps = previous.observableProps;
    this.subscriptions = previous.subscriptions;
    this.template = previous.template;

    // update props
    this.updateProps();

    // get parent information
    const parent = element.parentElement!;
    const elementIndex = Array.from(parent.childNodes).indexOf(element);
    const childNodesLength = previous.childNodes.length;

    // create new tree
    this.tree = createTree(this.template);
    const patches = this.shiftPatches(element, diff(previous.tree, this.tree));
    patch(parent, patches);

    // update child nodes
    this.childNodes = Array.from(parent.childNodes).slice(
      elementIndex,
      elementIndex + childNodesLength
    );
  }

  destroy(): void {
    // remove children
    this.childNodes.forEach(child => {
      if (child.parentElement) {
        child.remove();
      }
    });

    // unsubscribe
    this.subscriptions.forEach(subscription => {
      subscription.unsubscribe();
    });
  }

  requestRender(): void {
    if (!this.requestedRender) {
      this.requestedRender = true;
      requestAnimationFrame(() => {
        this.requestedRender = false;
        this.update({ ...this }, this.childNodes[0] as Element);
      });
    }
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
    if (found && shift > 0) {
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

  /** @TODO complete props on destroy */
  private updateProps(): void {
    Object.keys(this.props).forEach(key => {
      const value = this.props[key];

      if (this.observableProps.hasOwnProperty(key)) {
        this.observableProps[key].next(value);
      } else {
        this.observableProps[key] = state(value);
      }
    });

    Object.keys(this.observableProps).forEach(key => {
      if (!this.props.hasOwnProperty(key)) {
        delete this.observableProps[key];
      }
    });
  }
}
