import {
  createState,
  createSubscription,
  EventEmitter,
  State,
} from '../../core';
import { h } from '../h';
import { VirtualNode } from './virtual-node';

export class ComponentRef {
  private readonly lifecycleHooks: Record<string, () => void> = {};
  private readonly props: Record<string, State<any> & EventEmitter<any>>;
  private readonly states: State<any>[] = [];
  private readonly subscription = createSubscription();
  private template: VirtualNode | null = null;

  constructor(element: Element) {
    const props: Record<string, State<any> & EventEmitter<any>> = {};
    this.props = new Proxy(props, {
      get: (target, key: string) => {
        if (key in target) {
          return target[key];
        }

        // create emittable state
        const state = createState() as State<any> & EventEmitter<any>;

        // listen to state changes
        let skip = true;
        this.subscription.add(
          state.subscribe(e => {
            if (!skip) {
              element.dispatchEvent(new CustomEvent(key, { detail: e }));
            }
            skip = false;
          })
        );

        target[key] = state;
        return state;
      },
    });
  }

  dispose(node: VirtualNode): void {
    if (this.template) {
      node.children = [this.template];
    }

    this.lifecycleHooks['destroy']?.();
    this.states.forEach(state => state.complete());
    Object.values(this.props).forEach(state => state.complete());
    this.subscription.unsubscribe();
  }

  create(node: VirtualNode): Node {
    // set reference and get component template
    ComponentRef.currentRef = this;
    const template = (node.Component!(this.props) as VirtualNode) ?? h('#');
    this.template = this.bildTemplate(template, node.children);
    ComponentRef.currentRef = null;
    return this.template.createElement();
  }

  getChildren(): Node[] {
    if (!this.template) {
      return [];
    }
    if (this.template.sel) {
      return [this.template.element!];
    }
    const meta = this.template.getMetadata();
    return meta.children;
  }

  pushLifecycleHook(key: string, hook: () => void): void {
    this.lifecycleHooks[key] = hook;
  }

  pushState(state: State<any>): void {
    this.states.push(state);
  }

  getProp(key: string): any {
    const prop = this.props[key];
    return prop();
  }

  setProp(key: string, value: any): void {
    const prop = this.props[key];
    prop.next(value);
  }

  private bildTemplate(
    template: VirtualNode,
    children: VirtualNode[] = []
  ): VirtualNode {
    // hydrate template
    const visitor = (node: VirtualNode): VirtualNode => {
      if (node.sel === 'slot') {
        const slot = node.data?.attrs?.name as string | undefined;
        const select = node.data?.attrs?.select as string | undefined;

        let content: VirtualNode[] = [];
        if (select) {
          content = children.filter(child =>
            typeof select === 'string'
              ? child.sel === select
              : child.Component === select
          );
        } else if (slot) {
          content = children
            .filter(child => child.data?.slot === slot)
            .map(child => child.clone());
        }

        if (content.length === 0) {
          return h(null, null, ...node.children);
        }
        if (content.length === 1) {
          return content[0];
        }
        return h(null, null, ...content);
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
