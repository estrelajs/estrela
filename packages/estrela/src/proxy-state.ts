import { createState, State } from './observables';

export type ProxyState<T extends Object> = T & {
  $: { [K in keyof T]-?: State<T[K]> };
};

type ProxyTarget<T> = Record<keyof T, State<any>>;

export function createProxyState<T extends Object>(
  initialState?: T
): ProxyState<T> {
  const getProxyState = (target: ProxyTarget<T>, prop: keyof T) => {
    const state = target[prop] ?? createState(initialState?.[prop]);
    target[prop] = state;
    return state;
  };
  return new Proxy({} as ProxyTarget<T>, {
    get(target, prop) {
      if (prop === '$') {
        return new Proxy(
          {},
          { get: (_, prop) => getProxyState(target, prop as keyof T) }
        );
      }
      const state = getProxyState(target, prop as keyof T);
      return state.$;
    },
    set(target, prop, value) {
      const state = getProxyState(target, prop as keyof T);
      state.next(value);
      return true;
    },
  }) as any;
}
