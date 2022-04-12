import { fragment, htmlDomApi, vnode } from 'snabbdom';
import { ObservableState, state, Subscription } from '../core';
import { buildTemplate } from './builders/template-builder';
import { HTMLTemplate } from './html';
import { patch } from './patch';
import { VirtualNode, VirtualNodeData } from './virtual-node';

export class ComponentRef {
  readonly props: Record<string, ObservableState<any>> = {};
  readonly states: ObservableState<any>[] = [];
  readonly template: HTMLTemplate;
  private hookIndex = 0;
  private requestedRender = false;
  private subscriptions: Subscription[] = [];

  private constructor(private vnode: VirtualNode) {
    // create observable props
    Object.keys(vnode.data.props).forEach(key => {
      this.props[key] = state(vnode.data.props[key]);
    });

    // set reference and get component template
    ComponentRef.currentRef = this;
    this.template = vnode.Component!(this.props);

    // subscribe to states
    this.states.forEach(state => {
      this.subscriptions.push(state.subscribe(() => this.requestRender()));
    });
  }

  dispose(): void {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }

  nextHook(): number {
    return this.hookIndex++;
  }

  patchVNode(vnode: VirtualNode): void {
    this.vnode = vnode;
    this.patchData(vnode.data);
    vnode.children = this.getChildren();
  }

  pushState(state: ObservableState<any>): void {
    this.states.push(state);
  }

  requestRender(): void {
    if (!this.requestedRender) {
      this.requestedRender = true;
      requestAnimationFrame(() => {
        this.requestedRender = false;
        this.render();
      });
    }
  }

  private getChildren(): VirtualNode[] {
    this.hookIndex = 0;
    ComponentRef.currentRef = this;
    return buildTemplate(this.template).children;
  }

  private patchData(data: VirtualNodeData): void {
    Object.keys(data.props).forEach(key => {
      const prop = this.props[key];
      if (prop && prop() !== data.props[key]) {
        prop.next(data.props[key]);
      }
    });
  }

  private render(): void {
    const parent = htmlDomApi.parentNode(this.vnode.elm!) as HTMLElement;
    const oldVNode = vnode(
      undefined,
      {},
      this.vnode.children,
      undefined,
      parent
    );
    const newVNode = vnode(
      undefined,
      {},
      this.getChildren(),
      undefined,
      parent
    );
    const result = patch(oldVNode, newVNode);
    this.vnode.children = result.children as any;
  }

  static currentRef: ComponentRef | null = null;

  static createRef(vnode: VirtualNode): ComponentRef {
    return new ComponentRef(vnode);
  }
}
