import { createSubscription, Subscription } from './subscription';
import { symbol_observable } from './symbol';
import { ObservableLike, Observer } from './types';
import { coerceObserver } from './utils';

export interface Observable<T> extends ObservableLike<T> {}

export function createObservable<T>(
  subscribe?: (subscriber: Observer<T>) => void | (() => void) | Subscription
): Observable<T> {
  return {
    [symbol_observable]() {
      return this;
    },
    subscribe(observer) {
      const subscriber = coerceObserver(observer);
      const cleanup = subscribe?.(subscriber);
      return createSubscription(() => {
        subscriber.complete();
        if (typeof cleanup === 'function') {
          cleanup();
        } else {
          cleanup?.unsubscribe();
        }
      });
    },
  };
}

export function isObservable<T>(x: any): x is Observable<T> {
  return x && typeof x[symbol_observable] === 'function';
}
