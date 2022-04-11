import { fragment, VNode } from 'snabbdom';
import { Component, ObservableState, state } from '../core';
import { buildTemplate } from './builders/template-builder';
import { HTMLTemplate } from './html';
import { patch } from './patch';
import { VirtualNodeData } from './virtual-node';

export class ComponentRef {
  readonly props: Record<string, ObservableState<any>> = {};
  readonly states: ObservableState<any>[] = [];
  readonly template: HTMLTemplate;

  private children: Array<VNode | string> = [];
  private hookIndex = 0;
  private requestedRender = false;

  private constructor(readonly Component: Component, data: VirtualNodeData) {
    Object.keys(data.props).forEach(key => {
      this.props[key] = state(data.props[key]);
    });

    ComponentRef.currentRef = this;
    this.template = Component(this.props);

    this.states.forEach(state => {
      state.subscribe(() => this.requestRender());
    });
  }

  dispose(): void {}

  nextHook(): number {
    return this.hookIndex++;
  }

  patchChildren(children: Array<VNode | string>): void {
    // clear children
    while (children.length) {
      children.pop();
    }

    // update data
    this.hookIndex = 0;
    this.children = children;
    ComponentRef.currentRef = this;

    // update children
    buildTemplate(this.template).children!.forEach(child =>
      children.push(child)
    );
  }

  patchData(data: VirtualNodeData): void {
    Object.keys(data.props).forEach(key => {
      const prop = this.props[key];
      if (prop && prop() !== data.props[key]) {
        prop.next(data.props[key]);
      }
    });
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

  private render(): void {
    const oldTree = fragment([...this.children]);
    this.patchChildren(this.children);
    const newTree = fragment(this.children);
    patch(oldTree, newTree);
  }

  static currentRef: ComponentRef | null = null;

  static createRef(Component: Component, data: VirtualNodeData): ComponentRef {
    const ref = new ComponentRef(Component, data);
    ComponentRef.currentRef = ref;
    return ref;
  }
}
