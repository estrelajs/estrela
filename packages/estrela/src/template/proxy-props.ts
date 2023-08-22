import { isSignal } from '../signal';
import { Signal } from '../types';
import { identity } from '../utils';
import { EventEmitter } from './event-emitter';

export type ProxyProps = Record<
  string,
  EventEmitter<unknown> | Signal<unknown>
>;

export function createProxyProps(): ProxyProps {
  return new Proxy({} as ProxyProps, {
    getPrototypeOf: identity,
    get(target, key: string) {
      const bindKey = `bind:${key}`;
      const prop = target[bindKey] ?? target[key];
      if (prop instanceof EventEmitter) {
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
