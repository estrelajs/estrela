import {
  createEventEmitter,
  createState,
  EventEmitter,
  from,
  isNextable,
  isSelectable,
  State,
  Subscription,
} from '../observables';
import { effect } from './effect';

export class StateProxyHandler implements ProxyHandler<any> {
  constructor(private data: any, private cleanup?: Subscription) {}

  get(target: any, prop: string) {
    if (prop === '$') {
      return new Proxy(target, { get: this.getState.bind(this) });
    }
    const state = this.getState(target, prop);
    return state instanceof State ? state.$ : state;
  }

  set(target: any, prop: string, value: any) {
    if (prop === '$') {
      return false;
    }
    const state = this.getState(target, prop);
    state.next(value);
    return true;
  }

  private getState(target: any, prop: string): State<any> | EventEmitter<any> {
    let state: State<any> | EventEmitter<any>;
    if (prop in target) {
      return target[prop];
    }
    if (this.data.hasOwnProperty(`on:${prop}`)) {
      state = createEventEmitter();
      const subscription = state.subscribe(e => {
        const handler = this.data[`on:${prop}`];
        if (isNextable(handler)) {
          handler.next(e);
        } else if (typeof handler === 'function') {
          handler(e);
        }
      });
      this.cleanup?.add(subscription);
    } else {
      const value = this.data[prop];
      state = createState();
      if (typeof value === 'function') {
        this.cleanup?.add(effect(value).subscribe(state));
      } else if (value instanceof State) {
        this.cleanup?.add(value.subscribe(state, { initialEmit: true }));
      } else if (isSelectable(value)) {
        this.cleanup?.add(from(value).subscribe(state));
      } else {
        state.next(value);
      }
    }
    target[prop] = state;
    return state;
  }
}
