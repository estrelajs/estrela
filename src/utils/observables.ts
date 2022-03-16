import { Observer } from 'rxjs';

/** Whether x is RxJs Observer, that contains a next function. */
export function isObserver<T = any>(x: any): x is Observer<T> {
  return typeof x.next === 'function';
}
