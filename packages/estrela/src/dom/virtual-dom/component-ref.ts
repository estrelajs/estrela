import {
  coerceObservable,
  Component,
  createEventEmitter,
  createState,
  createSubscription,
  EventEmitter,
  isState,
  State,
  Subscription,
} from '../../core';
import { createSelector } from '../../store';
import { h } from '../h';
import { VirtualNode } from './virtual-node';

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
    Object.values(this.props).forEach(state => state.complete());
    this.propsCleanup.forEach(subscription => subscription.unsubscribe());
    this.cleanup.unsubscribe();
  }

  createElement(): Node {
    this.patch(h(), this.node);

    // set reference and get component template
    ComponentRef.currentRef = this;
    const template = (this.node.kind as Component)(this.props) ?? h('#');
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
    this.props.children.next(this.getChildren());
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

      if (isState(cur)) {
        this.props[key] = cur;
      } else {
        const subscription = coerceObservable(cur).subscribe(value => {
          const prop = this.props[key];
          const propValue = isState(prop) ? prop() : undefined;
          if (propValue !== value) {
            prop.next(value);
          }
        });
        this.propsCleanup.set(key, subscription);
      }
    }
  }

  pushHook(key: string, hook: () => void): void {
    this.hooks[key] = hook;
  }

  pushState(state: State<any>): void {
    this.states.push(state);
  }

  private createProps(): Record<string, State<any> | EventEmitter<any>> {
    return new Proxy({} as Record<string, State<any> | EventEmitter<any>>, {
      get: (target, key: string) => {
        let prop: State<any> | EventEmitter<any>;
        if (key in target) {
          return target[key];
        }

        if (this.node?.data?.events?.hasOwnProperty(key)) {
          prop = createEventEmitter();
          const subscription = prop.subscribe(e =>
            this.node.element!.dispatchEvent(
              new CustomEvent(key, { detail: e })
            )
          );
          this.cleanup.add(subscription);
        } else {
          prop = createState();
        }

        target[key] = prop;
        return prop;
      },
    });
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

        fragment.observable = createSelector(this.props.children, () => {
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
          // .map(child => child.clone());
        });
        return fragment;
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
