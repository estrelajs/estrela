import { htmlDomApi, vnode } from '@estrelajs/snabbdom';
import {
  EventEmitter,
  ObservableState,
  state,
  StyledComponent,
  Subscription,
} from '../core';
import { coerceFunction } from '../utils';
import { buildTemplate } from './builders/template-builder';
import { HTMLTemplate } from './html';
import { patch } from './patch';
import {
  createVirtualNode,
  VirtualNode,
  VirtualNodeData,
} from './virtual-node';

export class ComponentRef {
  private readonly emitters: Record<string, EventEmitter<any>> = {};
  private readonly states: ObservableState<any>[] = [];
  private readonly props: Record<string, ObservableState<any>>;
  private readonly template: () => HTMLTemplate | VirtualNode | null;
  private readonly lifeCycleHooks: Record<string, Function> = {};
  private hookIndex = 0;
  private requestedRender = false;
  private subscriptions: Subscription[] = [];

  private constructor(private vnode: VirtualNode) {
    // create observable props
    const props = Object.keys(vnode.data.props).reduce((acc, key) => {
      acc[key] = state(vnode.data.props[key]);
      return acc;
    }, {} as Record<string, ObservableState<any>>);

    // create props proxy to prevent null reference
    this.props = new Proxy(props, {
      get(target, prop: string) {
        return prop in target ? target[prop] : state();
      },
    });

    // set reference and get component template
    ComponentRef.currentRef = this;
    this.template = coerceFunction(vnode.Component!(this.props));

    // subscribe to emitters
    Object.keys(this.emitters).forEach(key => {
      const emitter = this.emitters[key];
      this.subscriptions.push(
        emitter.subscribe(e => {
          this.vnode.elm?.dispatchEvent(new CustomEvent(key, { detail: e }));
        })
      );
    });

    // subscribe to states
    this.states.forEach(state => {
      this.subscriptions.push(state.subscribe(() => this.requestRender()));
    });

    // call onInit hook
    requestAnimationFrame(() => {
      this.lifeCycleHooks['onInit']?.();
    });
  }

  dispose(): void {
    this.lifeCycleHooks['onDestroy']?.();
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

  pushEmitter(key: string, emitter: EventEmitter<any>): void {
    this.emitters[key] = emitter;
  }

  pushLifeCycleHook(key: string, hook: Function): void {
    this.lifeCycleHooks[key] = hook;
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

    const result = this.template();
    const vnode =
      result instanceof HTMLTemplate
        ? buildTemplate(result)
        : result ?? buildTemplate({ args: [], template: [''] as any });
    const styledComponent = this.vnode.Component as StyledComponent<any>;

    this.walk(vnode, vnode => {
      if (vnode.sel === 'slot') {
        const fragment = createVirtualNode();
        const slot = vnode.data.attrs.name as string | undefined;
        fragment.children = this.vnode.children.filter(
          child => child.data.slot === slot
        );
        return fragment;
      }
      if (styledComponent?.styleId && vnode.sel && vnode.data?.attrs) {
        const attr = `_host-${styledComponent.styleId}`;
        vnode.data.attrs[attr] = true;
      }
      return vnode;
    });

    return vnode.children;
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
    if (parent) {
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
  }

  private walk(
    vnode: VirtualNode,
    cb: (vnode: VirtualNode) => VirtualNode
  ): VirtualNode {
    vnode = cb(vnode);
    if (vnode.children?.length > 0) {
      vnode.children = vnode.children.map(child => this.walk(child, cb));
    }
    return vnode;
  }

  static currentRef: ComponentRef | null = null;

  static createRef(vnode: VirtualNode): ComponentRef {
    return new ComponentRef(vnode);
  }
}
