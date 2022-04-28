import { createObservable } from './observable';
import { symbol_observable } from './symbol';
import {
  EventEmitter,
  Observable,
  Observer,
  State,
  Subscribable,
  Subscriber,
  Subscription,
  Unsubscribable,
} from './types';

const noop = () => {};

export function coerceObservable<T>(
  promise: T | Promise<T> | Subscribable<T>
): Observable<T> {
  if (isObservable(promise)) {
    return promise;
  }
  return createObservable(subscriber => {
    if (isSubscribable(promise)) {
      promise.subscribe(subscriber);
    } else if (isPromise(promise)) {
      const then = promise.then(value => {
        subscriber.next(value);
        subscriber.complete();
      });
      if (then.catch) {
        then.catch(err => subscriber.error(err));
      }
    } else {
      subscriber.next(promise);
      subscriber.complete();
    }
  });
}

export function coerceObserver<T>(
  observer?: ((value: T) => void) | Partial<Observer<T>>
): Observer<T> {
  let {
    next = noop,
    error = noop,
    complete = noop,
  } = typeof observer === 'function' && !isState(observer)
    ? { next: observer }
    : (observer as Partial<Observer<T>>) ?? {};
  next = next.bind(observer);
  error = error.bind(observer);
  complete = complete.bind(observer);
  return { next, error, complete };
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

export function createSubscription(
  subscription?: (() => void) | Unsubscribable
): Subscription {
  const subscriptions = new Set<Unsubscribable>();
  if (subscription) {
    if (typeof subscription === 'function') {
      subscription = { unsubscribe: subscription };
    }
    subscriptions.add(subscription);
  }
  return {
    add(subscription) {
      subscriptions.add(subscription);
    },
    unsubscribe() {
      if (subscriptions.size > 0) {
        subscriptions.forEach(subscription => subscription.unsubscribe());
        subscriptions.clear();
      }
    },
  };
}

export function isEventEmitter<T>(x: any): x is EventEmitter<T> {
  return (
    x &&
    typeof x[symbol_observable] === 'function' &&
    typeof x.emit === 'function'
  );
}

export function isObservable<T>(x: any): x is Observable<T> {
  return x && typeof x[symbol_observable] === 'function';
}

export function isPromise<T>(x: any): x is Promise<T> {
  return x && typeof x.then === 'function';
}

export function isState<T>(x: any): x is State<T> {
  return (
    x &&
    typeof x === 'function' &&
    typeof x[symbol_observable] === 'function' &&
    typeof x.next === 'function'
  );
}

export function isSubscriber<T>(x: any): x is Subscriber<T> {
  return (
    typeof x === 'object' &&
    typeof x.next === 'function' &&
    typeof x.error === 'function' &&
    typeof x.complete === 'function'
  );
}

export function isSubscribable<T>(x: any): x is Subscribable<T> {
  return x && typeof x.subscribe === 'function';
}
