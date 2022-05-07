import { createSubscriber } from './subscriber';
import { createSubscription } from './subscription';
import { symbol_observable } from './symbol';
import { ObservableLike, Observer, SubjectObserver } from './types';
import { coerceObserver } from './utils';

export interface EventEmitter<T> extends ObservableLike<T>, SubjectObserver<T> {
  /** Emit event with the given value. */
  next(value: T): void;

  /** Emit event with the given value. */
  emit(value: T): void;

  type: 'emitter';
}

export function createEventEmitter<T>(async = false): EventEmitter<T> {
  const observers = new Set<Observer<T>>();
  const subscriber = createSubscriber(observers);
  return {
    [symbol_observable]() {
      return this;
    },
    get $() {
      return this;
    },
    get closed() {
      return subscriber.closed;
    },
    get observed() {
      return observers.size > 0;
    },
    next(value: any) {
      if (async) {
        setTimeout(subscriber.next, undefined, value);
      } else {
        subscriber.next(value);
      }
    },
    emit(value: any) {
      this.next(value);
    },
    error(err: any) {
      subscriber.error(err);
    },
    complete() {
      subscriber.complete();
    },
    subscribe(observer: any) {
      const obs = coerceObserver(observer);
      observers.add(obs);
      return createSubscription(() => observers.delete(obs));
    },
    type: 'emitter',
  } as EventEmitter<T>;
}

export function isEventEmitter<T>(x: any): x is EventEmitter<T> {
  return (
    x &&
    x.type === 'emitter' &&
    typeof x[symbol_observable] === 'function' &&
    typeof x.emit === 'function'
  );
}
