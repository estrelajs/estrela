import { Observable } from './observable';
import { ObservableState } from './state';
import { Observer, Subscriber } from './types';
import { isObservableState } from './utils';

export const STATE_STORE = new Set<ObservableState<any>>([]);

export const symbol_observable: typeof Symbol.observable = (() =>
  (typeof Symbol === 'function' && Symbol.observable) ||
  '@@observable')() as any;

export function createObservable<T>(
  subscribe?: (subscriber: Observer<T>) => void
): [Observable<T>, Subscriber<T>] {
  const observers = new Set<Observer<T>>();
  const subscriber = createSubscriber(observers);
  let hasSubscribed = false;

  const observable: Observable<T> = {
    get completed() {
      return subscriber.completed;
    },

    get hasError() {
      return subscriber.hasError;
    },

    get observed() {
      return observers.size > 0;
    },

    subscribe(observer) {
      if (subscriber.completed || subscriber.hasError) {
        // throw error?
        return { unsubscribe() {} };
      }

      // call `subscribe` on first subscription
      if (!hasSubscribed) {
        hasSubscribed = true;
        subscribe?.(subscriber);
      }

      // parse observer
      const {
        next = () => {},
        error = () => {},
        complete = () => {},
      } = typeof observer === 'function' && !isObservableState(observer)
        ? { next: observer }
        : (observer as Partial<Observer<T>>) ?? {};

      // add observer
      const obs = { next, error, complete };
      observers.add(obs);

      // return subscription
      return {
        unsubscribe() {
          observers.delete(obs);
        },
      };
    },

    [symbol_observable]() {
      return this;
    },
  };

  return [observable, subscriber];
}

export function createSubscriber<T>(
  observers: Set<Observer<T>>
): Subscriber<T> {
  return {
    completed: false,
    hasError: false,
    next(value: T) {
      observers.forEach(observer => observer.next(value));
    },
    error(err: any) {
      observers.forEach(observer => observer.error(err));
      observers.clear();
      this.hasError = true;
      this.thrownError = err;
    },
    complete() {
      observers.forEach(observer => observer.complete());
      observers.clear();
      this.completed = true;
    },
  };
}
