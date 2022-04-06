import { createObservable, createSubscriber } from './mixins';
import { Observer, Subscription } from './types';

export interface Observable<T> {
  get completed(): boolean;
  get hasError(): boolean;
  get observed(): boolean;
  subscribe(
    observer?: ((value: T) => void) | Partial<Observer<T>>
  ): Subscription;
  [Symbol.observable](): Observable<T>;
}

export function observable<T>(
  subscribe?: (subscriber: Observer<T>) => void
): Observable<T> {
  const observers = new Set<Observer<T>>();
  const subscriber = createSubscriber(observers);
  subscribe?.(subscriber);
  return createObservable(subscriber, observers);
}
