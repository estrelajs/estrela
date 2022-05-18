import { STATE_CALLS } from '../internal/tokens';
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

  type: 'state';
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
      STATE_CALLS.add(state);
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
    error(err: any) {
      subscriber.error(err);
    },
    complete() {
      subscriber.complete();
    },
    subscribe(observer: any, options = {}) {
      const obs = coerceObserver(observer);
      observers.add(obs);
      if (options.initialEmit) {
        obs.next(value);
      }
      return createSubscription(() => observers.delete(obs));
    },
    type: 'state',
  };
  return state;
}

export function isState<T>(x: any): x is State<T> {
  return (
    x &&
    x.type === 'state' &&
    x.hasOwnProperty('$') &&
    typeof x[symbol_observable] === 'function' &&
    typeof x.next === 'function'
  );
}
