import { StateProxyHandler } from './internal';
import { State } from './observables';

export type StateProxy<T extends Object> = T & {
  $: { [K in keyof T]-?: State<T[K]> };
};

type ProxyTarget<T> = Record<keyof T, State<any>>;

export function createStateProxy<T extends Object>(
  initialState?: T
): StateProxy<T> {
  return new Proxy(
    {} as ProxyTarget<T>,
    new StateProxyHandler(initialState ?? {})
  ) as any;
}
