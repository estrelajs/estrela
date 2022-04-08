import { Component, ObservableState, state } from '.';
import { buildTemplate } from '../dom/builders/template-builder';
import { HTMLTemplate } from '../dom/html';
import { patch } from '../dom/patch';
import { f, VNode } from '../dom/vnode';

export class ComponentRef {
  readonly props: Record<string, ObservableState<any>> = {};
  readonly states: ObservableState<any>[] = [];
  readonly template: HTMLTemplate;

  private children: VNode[] = [];
  private hookIndex = 0;
  private requestedRender = false;

  private constructor(
    readonly Component: Component,
    props: Record<string, any>
  ) {
    Object.keys(props).forEach(key => {
      this.props[key] = state(props[key]);
    });

    ComponentRef.currentRef = this;
    this.template = Component(this.props);

    this.states.forEach(state => {
      state.subscribe(() => this.requestRender());
    });
  }

  nextHook(): number {
    return this.hookIndex++;
  }

  patchChildren(children: VNode[]): void {
    while (children.length) {
      children.pop();
    }
    this.hookIndex = 0;
    this.children = children;
    ComponentRef.currentRef = this;
    const fragment = buildTemplate(this.template);
    fragment.children.forEach(child => children.push(child));
  }

  patchProps(props: Record<string, any>): void {
    Object.keys(props).forEach(key => {
      const prop = this.props[key];
      if (prop && prop() !== props[key]) {
        prop.next(props[key]);
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
    const oldTree = f([...this.children]);
    this.patchChildren(this.children);
    const newTree = f(this.children);
    patch(oldTree, newTree);
  }

  static currentRef: ComponentRef | null = null;

  static createRef(
    Component: Component,
    props: Record<string, any>
  ): ComponentRef {
    const ref = new ComponentRef(Component, props);
    ComponentRef.currentRef = ref;
    return ref;
  }
}
