import { symbol_observable } from './symbol';
import { Observable, Observer } from './types';
import { coerceObserver, createSubscriber, createSubscription } from './utils';

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
      return createSubscription(subscriber);
    },
  };
}
