import { ComponentRef } from '../../dom/virtual-dom/component-ref';
import { createSubscriber } from './subscriber';
import { createSubscription } from './subscription';
import { symbol_observable } from './symbol';
import { ObservableLike, Observer, SubjectObserver } from './types';
import { coerceObserver } from './utils';

export interface State<T> extends ObservableLike<T>, SubjectObserver<T> {
  /** Get the current state value. */
  (): T;

  /** Type safe to behave like an observer. */
  asObserver(): Observer<T>;

  /**
   * Update the current state.
   * @param value next value.
   */
  next(value: T): void;

  /**
   * Update the current state based on the last value.
   * @param updater callback function to update current state.
   */
  update(updater: (value: T) => T): void;
}

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
    get closed() {
      return subscriber.closed;
    },
    get observed() {
      return observers.size > 0;
    },
    get value() {
      return value;
    },
    asObserver() {
      return descriptor as any;
    },
    next(next: any) {
      subscriber.next((value = next));
    },
    update(setter: (value: any) => any) {
      this.next((value = setter(value)));
    },
    error(err: any) {
      subscriber.error(err);
    },
    complete() {
      subscriber.complete();
    },
    subscribe(observer: any) {
      const obs = coerceObserver(observer);
      observers.add(obs);
      obs.next(value);
      return createSubscription(() => observers.delete(obs));
    },
  };

  const valueGetter = () => value;
  const instance = Object.assign(valueGetter, descriptor);
  ComponentRef.currentRef?.pushState(instance);
  return instance;
}

export function isState<T>(x: any): x is State<T> {
  return (
    x &&
    typeof x === 'function' &&
    typeof x[symbol_observable] === 'function' &&
    typeof x.next === 'function'
  );
}

export const state = createState;
