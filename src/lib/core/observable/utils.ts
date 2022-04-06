import { EventEmitter } from './emitter';
import { symbol_observable } from './mixins';
import { observable, Observable } from './observable';
import { ObservableState } from './state';

declare global {
  interface SymbolConstructor {
    readonly observable: symbol;
  }
}

export function from<T>(promise: Promise<T> | Observable<T>): Observable<T> {
  if (isObservable(promise)) {
    return promise;
  }
  return observable(subscriber => {
    promise
      .then(value => {
        subscriber.next(value);
        subscriber.complete();
      })
      .catch(err => subscriber.error(err));
  });
}

export function isObservable<T>(x: any): x is Observable<T> {
  return x && typeof x[symbol_observable] === 'function';
}

export function isEventEmitter<T>(x: any): x is EventEmitter<T> {
  return (
    x &&
    typeof x[symbol_observable] === 'function' &&
    typeof x.emit === 'function'
  );
}

export function isObservableState<T>(x: any): x is ObservableState<T> {
  return (
    typeof x === 'function' &&
    typeof x[symbol_observable] === 'function' &&
    typeof x.next === 'function'
  );
}
