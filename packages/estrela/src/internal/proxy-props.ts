import { Signal } from '../signal';
import { isSignal } from '../signal/signal';
import { identity } from '../utils';
import { Emitter } from './emitter';

export type ProxyProps = Record<string, Emitter<unknown> | Signal<unknown>>;

export function createProxyProps(): ProxyProps {
  return new Proxy({} as ProxyProps, {
    getPrototypeOf: identity,
    get(target, key: string) {
      const bindKey = `bind:${key}`;
      const prop = target[bindKey] ?? target[key];
      if (prop instanceof Emitter) {
        return prop.emitter;
      }
      if (isSignal(prop)) {
        return prop();
      }
      return prop;
    },
    set(target, key: string, value: unknown) {
      const bindKey = `bind:${key}`;
      const signal = target[bindKey] as Signal<unknown>;
      if (isSignal(signal)) {
        signal.set(value);
        return true;
      }
      return false;
    },
  });
}
