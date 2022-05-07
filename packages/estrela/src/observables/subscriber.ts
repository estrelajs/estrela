import { Observer } from './types';

export interface Subscriber<T> extends Observer<T> {
  closed: boolean;
  hasError: boolean;
  thrownError?: any;
}

export function createSubscriber<T>(
  observers: Set<Observer<T>>
): Subscriber<T> {
  let closed = false;
  let hasError = false;

  return {
    get closed() {
      return closed;
    },
    get hasError() {
      return hasError;
    },
    next(value: T) {
      observers.forEach(observer => observer.next(value));
    },
    error(err: any) {
      observers.forEach(observer => observer.error(err));
      observers.clear();
      hasError = true;
      this.thrownError = err;
    },
    complete() {
      observers.forEach(observer => observer.complete());
      observers.clear();
      closed = true;
    },
  };
}

export function isSubscriber<T>(x: any): x is Subscriber<T> {
  return (
    typeof x === 'object' &&
    typeof x.next === 'function' &&
    typeof x.error === 'function' &&
    typeof x.complete === 'function'
  );
}
