import { createSubscriber } from './subscriber';
import { createSubscription } from './subscription';
import { symbol_observable } from './symbol';
import { ObservableLike, Observer } from './types';
import { coerceObserver } from './utils';

export interface Observable<T> extends ObservableLike<T> {}

export function createObservable<T>(
  subscribe?: (subscriber: Observer<T>) => void
): Observable<T> {
  return {
    [symbol_observable]() {
      return this;
    },
    subscribe(observer) {
      const observers = new Set([coerceObserver(observer)]);
      const subscriber = createSubscriber(observers);
      subscribe?.(subscriber);
      return createSubscription(() => {
        subscriber.complete();
        observers.clear();
      });
    },
  };
}

export function isObservable<T>(x: any): x is Observable<T> {
  return x && typeof x[symbol_observable] === 'function';
}
