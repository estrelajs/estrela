import { effect, isSignal, signal } from '../signal';
import { Signal } from '../types';
import { isFunction } from '../utils';
import { EventEmitter, Listener } from './event-emitter';

export type ReactiveProps = {
  (props?: {}): void;
  [key: string]: EventEmitter<unknown> | Signal<unknown>;
} & {
  _track$: Map<string, () => void>;
};

export function createReactiveProps(): ReactiveProps {
  const proto = (() => {}) as ReactiveProps;
  proto._track$ = new Map();

  return new Proxy(proto, {
    apply(target, _, [props]) {
      for (let key in props) {
        if (key.startsWith('on:')) {
          const event = key.slice(3);
          const listener = props[key] as Listener<unknown>;
          if (!target[event] || isSignal(target[event])) {
            target[event] = new EventEmitter();
          }
          const emitter = target[event] as EventEmitter<unknown>;
          emitter.addListener(listener);
        }

        // bind props
        else if (key.startsWith('bind:')) {
          target[key] = props[key] as Signal<any>;
        }

        // computed props
        else {
          const prop = props[key];
          const signalProp = (target[key] ??= signal(undefined)) as Signal<any>;
          target._track$.get(key)?.();
          target._track$.set(
            key,
            effect(() => signalProp.set(isFunction(prop) ? prop() : prop))
          );
        }
      }
    },
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
