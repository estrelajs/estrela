import { symbol_observable } from './symbol';
import { EventEmitter, Observer } from './types';
import { createSubscriber, coerceObserver, createSubscription } from './utils';

export function createEventEmitter<T>(async = false): EventEmitter<T> {
  const observers = new Set<Observer<T>>();
  const subscriber = createSubscriber(observers);
  const descriptor = {
    [symbol_observable]() {
      return this;
    },
    get observed() {
      return observers.size > 0;
    },
    complete() {
      subscriber.complete();
    },
    next(value: any) {
      if (async) {
        setTimeout(subscriber.next, undefined, value);
      } else {
        subscriber.next(value);
      }
    },
    subscribe(observer: any) {
      observers.add(coerceObserver(observer));
      return createSubscription(subscriber);
    },
  };
  return descriptor;
}
