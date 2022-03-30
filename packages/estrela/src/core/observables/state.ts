import { ComponentRef } from '../../dom/virtual-dom/component-ref';
import { symbol_observable } from './symbol';
import { Observer, State } from './types';
import { createSubscriber, coerceObserver, createSubscription } from './utils';

export function createState<T>(): State<T | undefined>;
export function createState<T>(initialValue: T): State<T>;
export function createState(initialValue?: any): State<any> {
  let value = initialValue ?? undefined;
  const observers = new Set<Observer<any>>();
  const subscriber = createSubscriber(observers);

  const descriptor = {
    [symbol_observable]() {
      return this;
    },
    get value() {
      return value;
    },
    asObserver() {
      return descriptor as any;
    },
    complete() {
      subscriber.complete();
    },
    next(next: any) {
      subscriber.next((value = next));
    },
    subscribe(observer: any) {
      const obs = coerceObserver(observer);
      observers.add(obs);
      obs.next(value);
      return createSubscription(subscriber);
    },
    update(setter: (value: any) => any) {
      this.next((value = setter(value)));
    },
  };

  const valueGetter = () => value;
  const instance = Object.assign(valueGetter, descriptor);
  ComponentRef.currentRef?.pushState(instance);
  return instance;
}

export const state = createState;
