import { Subscription } from './subscription';
import { symbol_observable } from './symbol';
import { ObservableLike, Observer, SubscriptionLike } from './types';
import { coerceObserver } from './utils';

export class Observable<T> implements ObservableLike<T> {
  constructor(
    private readonly cb: (
      subscriber: Observer<T>
    ) => (() => void) | SubscriptionLike | undefined
  ) {}

  [symbol_observable]() {
    return this;
  }

  subscribe(
    observer?: ((value: T) => void) | Partial<Observer<T>>
  ): Subscription {
    const subscriber = coerceObserver(observer);
    const cleanup = this.cb(subscriber);
    return new Subscription(cleanup);
  }
}
