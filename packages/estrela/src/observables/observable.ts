import { Subscription } from './subscription';
import { symbol_observable } from './symbol';
import { PartialObserver, Subscribable, Unsubscribable } from './types';
import { Observer } from './types';

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

export class Observable<T> implements Subscribable<T> {
  constructor(
    protected cb?: (
      subscriber: Observer<T>
    ) => (() => void) | Unsubscribable | void
  ) {}

  [symbol_observable]() {
    return this;
  }

  subscribe(observer?: PartialObserver<T>): Subscription {
    const subscriber = coerceObserver(observer);
    const cleanup = this.cb?.(subscriber);
    return new Subscription(cleanup ?? undefined);
  }
}
