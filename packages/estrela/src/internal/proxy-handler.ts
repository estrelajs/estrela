import {
  createEventEmitter,
  createState,
  EventEmitter,
  isNextable,
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
    if (prop in target) {
      return target[prop];
    }
    let state: State<any> | EventEmitter<any>;
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
      state = createState(this.data[prop]);
      if (typeof value === 'function') {
        const subscription = effect(value).subscribe(state);
        this.cleanup?.add(subscription);
      }
    }
    target[prop] = state;
    return state;
  }
}
