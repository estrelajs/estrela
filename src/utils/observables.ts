import { Observer } from 'rxjs';

export function isObserver<T = any>(x: any): x is Observer<T> {
  return typeof x?.next === 'function';
}
