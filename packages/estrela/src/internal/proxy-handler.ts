import { createState, State } from '../observables';

export class StateProxyHandler implements ProxyHandler<any> {
  constructor(private data: any) {}

  getPrototypeOf(target: any): any {
    return target;
  }

  get(target: any, prop: string) {
    if (prop === '$') {
      return target;
      // return new Proxy(target, { get: this.getState.bind(this) });
    }
    const state = this.getState(target, prop);
    return state.$;
  }

  set(target: any, prop: string, value: any) {
    if (prop === '$') {
      return false;
    }
    const state = this.getState(target, prop);
    state.next(value);
    return true;
  }

  private getState(target: any, prop: string): State<any> {
    if (prop in target) {
      return target[prop];
    }
    const state = createState(this.data[prop]);
    target[prop] = state;
    return state;
  }
}
