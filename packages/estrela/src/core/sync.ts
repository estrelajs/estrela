import {
  coerceObservable,
  createObservable,
  Subscribable,
} from './observables';

/**
 * Make a deferred object to act like a sync value inside JSX expressions.
 * Note: It only works inside JSX expressions, else it will act like a normal observable.
 *
 * @param async promise or observable
 * @returns sync value. If async hasn't emitted yet, returns undefined.
 */
export function sync<T>(async: Promise<T> | Subscribable<T>): T | undefined {
  const observable = createObservable(subscriber => {
    let emitted = false;
    subscriber.next = (next => value => {
      next(value);
      emitted = true;
    })(subscriber.next);
    coerceObservable(async).subscribe(subscriber);
    if (!emitted) {
      subscriber.next(undefined);
    }
  });
  return observable as any;
}
