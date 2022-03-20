import { NextObserver } from 'rxjs';

/** Whether x is RxJs Observer, that contains a next function. */
export function isNextObserver<T = any>(x: any): x is NextObserver<T> {
  return typeof x?.next === 'function';
}
