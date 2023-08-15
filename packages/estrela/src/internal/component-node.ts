import { Signal, effect, isSignal, signal } from '../signal';
import { EstrelaComponent } from '../types';
import { isFunction } from '../utils';
import { EventEmitter, Listener } from './event-emitter';
import { ProxyProps, createProxyProps } from './proxy-props';
import { NodeTrack, TemplateNode } from './template-node';

export type Hook = 'destroy' | 'init';

export class ComponentNode implements JSX.Element {
  static ref: ComponentNode | null = null;

  private hooks = {
    destroy: new Set<() => void>(),
    init: new Set<() => void>(),
  };
  private proxyProps = createProxyProps();
  private root: TemplateNode | null = null;
  private trackMap = new Map<string, NodeTrack>();

  get firstChild(): Node | null {
    return this.root?.firstChild ?? null;
  }

  get isConnected(): boolean {
    return this.root?.isConnected ?? false;
  }

  constructor(
    public readonly template: EstrelaComponent,
    private props: Record<string, unknown>
  ) {}

  addEventListener(event: string, listener: Listener<unknown>): void {
    const proxy: ProxyProps = Object.getPrototypeOf(this.proxyProps);
    if (!proxy[event] || isSignal(proxy[event])) {
      proxy[event] = new EventEmitter<unknown>();
    }
    const track = this.getNodeTrack(event, true);
    const emitter = proxy[event] as EventEmitter<unknown>;
    emitter.addListener(listener);
    track.cleanup = () => emitter.dispose();
  }

  removeEventListener(event: string, listener: Listener<unknown>): void {
    const proxy: ProxyProps = Object.getPrototypeOf(this.proxyProps);
    const emitter = proxy[event] as EventEmitter<unknown>;
    emitter?.removeListener?.(listener);
  }

  addHook(hook: Hook, cb: () => void): void {
    this.hooks[hook]?.add(cb);
  }

  inheritNode(node: ComponentNode): void {
    this.hooks = node.hooks;
    this.proxyProps = node.proxyProps;
    this.root = node.root;
    this.trackMap = node.trackMap;

    // patch props
    const props = this.props;
    this.props = node.props;
    this.patchProps(props);
  }

  mount(parent: Node, before: Node | null = null): Node[] {
    if (!isFunction(this.template)) {
      throw new Error('Component template must be a function');
    }

    if (this.isConnected) {
      return this.root?.mount(parent, before) ?? [];
    }

    this.patchProps(this.props);
    ComponentNode.ref = this;
    this.root = this.template.call(this.proxyProps);
    ComponentNode.ref = null;

    if (this.root && this.template.hasOwnProperty('styleId')) {
      this.root['styleId'] = (this.template as any).styleId;
    }

    const nodes = this.root?.mount(parent, before) ?? [];
    this.hooks.init.forEach(handler => handler());
    return nodes;
  }

  unmount(): void {
    this.hooks.destroy.forEach(handler => handler());
    this.hooks.destroy.clear();
    this.hooks.init.clear();

    this.trackMap.forEach(track => track.cleanup());
    this.trackMap.clear();

    this.root?.unmount();
    this.root = null;

    this.proxyProps = createProxyProps();
  }

  patchProps(props: Record<string, unknown>): void {
    const proxy: ProxyProps = Object.getPrototypeOf(this.proxyProps);

    for (let key in props) {
      if (key.startsWith('on:')) {
        const event = key.slice(3);
        const listener = props[key] as Listener<unknown>;
        this.removeEventListener(event, this.props[key] as Listener<unknown>);
        this.addEventListener(event, listener);
      }

      // bind props
      else if (key.startsWith('bind:')) {
        proxy[key] = props[key] as Signal<unknown>;
      }

      // computed props
      else {
        const prop = props[key];
        const signalProp = (proxy[key] ??=
          signal(undefined)) as Signal<unknown>;
        const track = this.getNodeTrack(key);
        track.cleanup = effect(() => {
          signalProp.set(isFunction(prop) ? prop() : prop);
        });
      }
    }

    this.props = props;
  }

  private getNodeTrack(
    trackKey: string,
    suppressCleanupCall?: boolean
  ): NodeTrack {
    let track = this.trackMap.get(trackKey);
    if (!track) {
      track = { cleanup: () => {} };
      this.trackMap.set(trackKey, track);
    }
    if (!suppressCleanupCall) {
      track.cleanup();
    }
    return track;
  }
}
