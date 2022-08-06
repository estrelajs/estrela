import { Subscription } from './subscription';
import { symbol_observable } from './symbol';
import { PartialObserver, Subscribable, Unsubscribable } from './types';
import { Observer } from './types';
import { coerceObserver } from './utils';

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
