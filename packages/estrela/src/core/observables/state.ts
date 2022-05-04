import { ComponentRef } from '../../dom/virtual-dom/component-ref';
import { createSubscriber } from './subscriber';
import { createSubscription } from './subscription';
import { symbol_observable } from './symbol';
import { ObservableLike, Observer, SubjectObserver } from './types';
import { coerceObserver } from './utils';

export interface State<T> extends ObservableLike<T>, SubjectObserver<T> {
  /** The current state value. */
  get $(): T;

  /**
   * Update the current state.
   * @param value next value.
   */
  next(value: T): T;

  /**
   * Update the current state based on the last value.
   * @param updater callback function to update current state.
   */
  update(updater: (value: T) => T): T;

  /**
   * Emit the current state. Useful when working with objects and arrays.
   * @param updater optional callback function to update current state.
   */
  refresh(updater?: (value: T) => void): T;
}

export function createState<T>(): State<T | undefined>;
export function createState<T>(initialValue: T): State<T>;
export function createState(initialValue?: any): State<any> {
  let value = initialValue ?? undefined;
  const observers = new Set<Observer<any>>();
  const subscriber = createSubscriber(observers);

  const state: State<any> = {
    [symbol_observable]() {
      return this;
    },
    get closed() {
      return subscriber.closed;
    },
    get observed() {
      return observers.size > 0;
    },
    get $() {
      return value;
    },
    next(next: any) {
      subscriber.next((value = next));
      return value;
    },
    update(updater: (value: any) => any) {
      this.next((value = updater(value)));
      return value;
    },
    refresh(updater?: (value: any) => void) {
      updater?.(value);
      subscriber.next(value);
      return value;
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

  ComponentRef.currentRef?.pushState(state);
  return state;
}

export function isState<T>(x: any): x is State<T> {
  return (
    x &&
    typeof x === 'function' &&
    typeof x[symbol_observable] === 'function' &&
    typeof x.next === 'function'
  );
}
