import { effect } from '../internal/effect';
import { Observable } from './observable';
import { Subscribable } from './types';

export function from<T>(x: any): Observable<T> {
  if (x instanceof Observable) {
    return x;
  }
  if (isSubscribable<T>(x)) {
    return new Observable(subscriber => {
      x.subscribe(subscriber, { initialEmit: true });
    });
  }
  if (typeof x === 'function') {
    return effect(x);
  }
  return new Observable(subscriber => {
    if (typeof x.then === 'function') {
      x.then((value: T) => subscriber.next(value));
    } else {
      subscriber.next(x);
    }
  });
}

export function isCompletable(x: any): x is { complete(): void } {
  return x && typeof x.complete === 'function';
}

export function isNextable<T>(x: any): x is { next(value: T): void } {
  return x && typeof x.next === 'function';
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
