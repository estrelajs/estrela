import {
  createState,
  createSubscription,
  EventEmitter,
  State,
} from '../../core';
import { h } from '../h';
import { VirtualNode } from '../virtual-node';

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

  dispose(): void {
    this.lifecycleHooks['destroy']?.();
    this.states.forEach(state => state.complete());
    Object.values(this.props).forEach(state => state.complete());
    this.subscription.unsubscribe();
  }

  patch(oldNode: VirtualNode, node: VirtualNode): void {
    if (oldNode.Component !== node.Component) {
      // set reference and get component template
      ComponentRef.currentRef = this;
      this.template = node.Component!(this.props) as VirtualNode | null;
      ComponentRef.currentRef = null;
    }

    this.hydrateNode(node);
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

  private hydrateNode(node: VirtualNode): void {
    const children = node.children ?? [];

    // hydrate template
    const visitor = (node: VirtualNode): VirtualNode => {
      node = { ...node };
      if (node.sel === 'slot') {
        const fragment = h();
        const slot = node.data?.attrs?.name as string | undefined;
        fragment.children = children.filter(child => child.data?.slot === slot);
        return fragment;
      } else if (node.children) {
        node.children = node.children.map(visitor);
      }
      return node;
    };

    const template = visitor(this.template!);
    if (!template.sel && !template.Component && !template.observable) {
      node.children = template.children;
    } else {
      node.children = [template];
    }
  }

  static currentRef: ComponentRef | null = null;
}
