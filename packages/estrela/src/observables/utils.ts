import { createObservable, isObservable, Observable } from './observable';
import { createSelector } from './selector';
import { Observer, Subscribable } from './types';

const noop = () => {};

export function coerceObserver<T>(
  observer?: ((value: T) => void) | Partial<Observer<T>>
): Observer<T> {
  let {
    next = noop,
    error = noop,
    complete = noop,
  } = typeof observer === 'function' && !(observer as any).subscribe
    ? { next: observer }
    : (observer as Partial<Observer<T>>) ?? {};
  next = next.bind(observer);
  error = error.bind(observer);
  complete = complete.bind(observer);
  return { next, error, complete };
}

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

export function isNextable<T>(x: any): x is { next: (value: T) => void } {
  return x && typeof x.next === 'function';
}

export function isPromise<T>(x: any): x is Promise<T> {
  return x && typeof x.then === 'function';
}

export function isSubscribable<T>(x: any): x is Subscribable<T> {
  return x && typeof x.subscribe === 'function';
}

export function tryParseObservable<T>(
  promise: (() => T) | PromiseLike<T> | Subscribable<T>
): Observable<T> {
  if (typeof promise === 'function') {
    return createSelector(promise);
  }
  if (isPromise(promise) || isObservable(promise)) {
    return coerceObservable(promise);
  }
  throw new Error('Invalid observable');
}
