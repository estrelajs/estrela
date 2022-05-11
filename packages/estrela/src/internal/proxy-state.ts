import { createState, State } from '../observables';

export type ProxyState<T extends Object> = T & {
  $: { [K in keyof T]: State<T[K]> };
};

type ProxyTarget = Record<string | number | symbol, State<any>>;

export function createProxyState<T extends Object>(): ProxyState<T> {
  return new Proxy({} as ProxyTarget, {
    get(target, prop) {
      if (prop === '$') {
        return new Proxy({}, { get: (_, prop) => getProxyState(target, prop) });
      }
      const state = getProxyState(target, prop);
      return state.$;
    },
    set(target, prop, value) {
      const state = getProxyState(target, prop);
      state.next(value);
      return true;
    },
  }) as any;
}

function getProxyState(target: ProxyTarget, prop: string | symbol) {
  const state = target[prop] ?? createState();
  target[prop] = state;
  return state;
}
