import {
  coerceObservable,
  createEventEmitter,
  createSelector,
  createState,
  createSubscription,
  EventEmitter,
  isState,
  State,
  Subscription,
} from '../../observables';
import { Component } from '../../types/jsx';
import { h } from '../h';
import { ProxyState } from '../proxy-state';
import { VirtualNode } from './virtual-node';

type ProxyTarget = Record<
  string | number | symbol,
  State<any> | EventEmitter<any>
>;

export class ComponentRef {
  private readonly cleanup = createSubscription();
  private readonly hooks: Record<string, () => void> = {};
  private readonly props = this.createProps();
  private readonly propsCleanup = new Map<string, Subscription>();
  private readonly states: State<any>[] = [];
  private children: VirtualNode[] = [];
  private template: VirtualNode | null = null;

  constructor(private node: VirtualNode) {}

  dispose(): void {
    if (this.template) {
      this.node.children = [this.template];
    }

    this.hooks['destroy']?.();
    this.states.forEach(state => state.complete());
    Object.values(this.props.$).forEach(state => (state as any).complete());
    this.propsCleanup.forEach(subscription => subscription.unsubscribe());
    this.cleanup.unsubscribe();
  }

  createElement(): Node {
    this.patch(h(), this.node);

    // set reference and get component template
    ComponentRef.currentRef = this;
    const template = (this.node.kind as Component)(this.props as any) ?? h('#');
    this.template = this.buildTemplate(template);
    ComponentRef.currentRef = null;

    return this.template.createElement();
  }

  getChildrenElements(): Node[] {
    if (!this.template) {
      return [];
    }
    if (this.template.kind) {
      return [this.template.element!];
    }
    const meta = this.template.getMetadata();
    return meta.children;
  }

  patch(oldNode: VirtualNode, node: VirtualNode): void {
    this.node = node;
    const props = node.data?.props ?? {};
    const oldProps = oldNode.data?.props ?? {};

    // patch children
    this.children = this.node.children ?? [];
    this.props.children = this.getChildren();
    this.node.children = [];

    if (oldProps === props) {
      return;
    }

    for (let key in oldProps) {
      const prop = oldProps[key];
      if (prop !== props[key]) {
        this.propsCleanup.get(key)?.unsubscribe();
        this.propsCleanup.delete(key);
      }
    }

    for (let key in props) {
      const cur = props[key];
      const old = oldProps[key];

      if (cur === old) {
        continue;
      }

      const subscription = coerceObservable(cur).subscribe(
        value => {
          if (this.props[key] !== value) {
            this.props[key] = value;
          }
        },
        { initialEmit: true }
      );
      this.propsCleanup.set(key, subscription);
    }
  }

  pushHook(key: string, hook: () => void): void {
    this.hooks[key] = hook;
  }

  pushState(state: State<any>): void {
    this.states.push(state);
  }

  setRef<T>(ref: T): void {
    const nodeRef = this.node.data?.ref as any;
    if (isState(nodeRef)) {
      nodeRef.next(ref);
    } else if (nodeRef) {
      nodeRef(ref);
    }
  }

  private createProps(): ProxyState<any> {
    const getProxyState = (target: ProxyTarget, prop: string | symbol) => {
      if (target[prop]) {
        return target[prop];
      }
      let state: State<any> | EventEmitter<any>;
      if (this.node?.data?.events?.hasOwnProperty(prop)) {
        state = createEventEmitter();
        const subscription = state.subscribe(e =>
          this.node.element!.dispatchEvent(
            new CustomEvent(String(prop), { detail: e })
          )
        );
        this.cleanup.add(subscription);
      } else {
        state = createState();
      }
      target[prop] = state;
      return state;
    };
    return new Proxy({} as ProxyTarget, {
      get(target, prop) {
        if (prop === '$') {
          return new Proxy(
            {},
            { get: (_, prop) => getProxyState(target, prop) }
          );
        }
        const state = getProxyState(target, prop);
        return isState(state) ? state.$ : state;
      },
      set(target, prop, value) {
        const state = getProxyState(target, prop);
        state.next(value);
        return true;
      },
    }) as any;
  }

  private getChildren() {
    const children = this.node.children!.map(child =>
      child.kind === '#text' || child.kind === '#comment'
        ? child.content
        : child.clone()
    );
    if (children.length === 0) {
      return null;
    }
    if (children.length === 1) {
      return children[0];
    }
    return children;
  }

  private buildTemplate(template: VirtualNode): VirtualNode {
    const visitor = (node: VirtualNode): VirtualNode => {
      if (node.kind === 'slot') {
        const fragment = h();
        const originalChildren = node.children;

        fragment.observable = createSelector(this.props.$.children, () => {
          const slot = node.data?.attrs?.name as string | undefined;
          const select = node.data?.attrs?.select as string | undefined;
          let content: VirtualNode[] = this.children;

          if (select) {
            content = this.children.filter(child => child.kind === select);
          } else if (slot) {
            content = this.children.filter(child => child.data?.slot === slot);
          }

          if (content.length === 0) {
            return originalChildren;
          }

          return content;
        });
        return fragment;
      }

      const styledComponent = this.node.kind as any;
      if (styledComponent.styleId) {
        node.data ??= {};
        node.data.attrs ??= {};
        node.data.attrs[`_${styledComponent.styleId}`] = '';
      }

      if (node.children) {
        node.children = node.children.map(visitor);
      }
      return node;
    };

    return visitor(template);
  }

  static currentRef: ComponentRef | null = null;
}
