import { effect } from '../internal/effect';
import { createState, State } from './state';
import {
  Observer,
  PartialObserver,
  Subscribable,
  Unsubscribable,
} from './types';

const noop = () => {};

export function coerceObserver<T>(observer?: PartialObserver<T>): Observer<T> {
  if (typeof observer === 'function') {
    return {
      next: observer,
      error: noop,
      complete: noop,
    };
  }
  let { next, error, complete } = observer ?? {};
  next = next ? next.bind(observer) : noop;
  error = error ? error.bind(observer) : noop;
  complete = complete ? complete.bind(observer) : noop;
  return { next, error, complete };
}

export function isCompletable(x: any): x is { complete(): void } {
  return x && typeof x.complete === 'function';
}

export function isNextable<T>(x: any): x is { next(value: T): void } {
  return x && typeof x.next === 'function';
}

export function isPromiseLike<T>(x: any): x is PromiseLike<T> {
  return x && typeof x.then === 'function';
}

export function isSelectable<T>(
  x: any
): x is Subscribable<T> | PromiseLike<T> | (() => T) {
  return (
    x &&
    (typeof x.subscribe === 'function' ||
      typeof x.then === 'function' ||
      typeof x === 'function')
  );
}

export function isSubscribable<T>(x: any): x is Subscribable<T> {
  return x && typeof x.subscribe === 'function';
}
