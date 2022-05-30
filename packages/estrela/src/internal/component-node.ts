import {
  createEventEmitter,
  createState,
  createSubscription,
  EventEmitter,
  isEventEmitter,
  isState,
  State,
  Subscription,
  tryParseObservable,
} from '../observables';
import { ProxyState } from '../proxy-state';
import { Component } from '../types/types';
import { coerceArray } from '../utils';
import { nodeApi } from './node-api';

type ProxyTarget = Record<
  string | number | symbol,
  State<any> | EventEmitter<any>
>;

export class ComponentNode {
  children: JSX.Element[] = [];

  readonly props = this.createProps();
  readonly propsCleanup: Record<string, Subscription> = {};
  readonly cleanup = createSubscription();

  constructor(
    readonly component: Component,
    public data: Record<string, any>
  ) {}

  dispose(): void {
    this.children = [];
    this.cleanup.unsubscribe();
    Object.keys(this.propsCleanup).forEach(key => {
      const cleanup = this.propsCleanup[key];
      cleanup.unsubscribe();
      delete this.propsCleanup[key];
    });
  }

  mount(parent: Node, before: JSX.Element | null = null): void {
    this.patch(this.data);
    const template = this.component(this.props);
    this.children = coerceArray(template);
    this.children.forEach(child => {
      nodeApi.insertBefore(parent, child, before);
    });
  }

  unmount(parent: Node): void {
    this.children.forEach(child => {
      nodeApi.removeChild(parent, child);
    });
    this.dispose();
  }

  patch(props: any): void {
    for (let key in this.props) {
      const prop = this.props[key];
      if (prop !== props[key]) {
        this.propsCleanup[key]?.unsubscribe();
        delete this.propsCleanup[key];
      }
    }

    for (let key in props) {
      if (key.startsWith('on:') || key === 'ref') {
        continue;
      }
      const prop = this.props[key];
      const nextProp = props[key];
      if (prop === nextProp) {
        continue;
      }
      const update = (value: any) => {
        if (this.props[key] !== value) {
          this.props[key] = value;
        }
      };
      try {
        this.propsCleanup[key] = tryParseObservable(nextProp).subscribe(
          update,
          { initialEmit: true }
        );
      } catch {
        update(nextProp);
      }
    }
  }

  private createProps(): ProxyState<any> {
    const getProxyState = (target: ProxyTarget, prop: string) => {
      if (target[prop]) {
        return target[prop];
      }
      let state: State<any> | EventEmitter<any>;
      if (this.data.hasOwnProperty(`on:${prop}`)) {
        state = createEventEmitter();
        this.cleanup.add(
          state.subscribe(e => {
            const handler = this.data[`on:${prop}`];
            if (isState(handler) || isEventEmitter(handler)) {
              handler.next(e);
            } else if (typeof handler === 'function') {
              handler(e);
            }
          })
        );
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
            { get: (_, prop) => getProxyState(target, String(prop)) }
          );
        }
        const state = getProxyState(target, String(prop));
        return isState(state) ? state.$ : state;
      },
      set(target, prop, value) {
        if (prop === '$') {
          return false;
        }
        const state = getProxyState(target, String(prop));
        state.next(value);
        return true;
      },
    }) as any;
  }
}
