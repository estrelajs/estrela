import { createObservable, createSubscriber } from './mixins';
import { Observable } from './observable';
import { Observer } from './types';

export interface EventEmitter<T> extends Observable<T> {
  /**
   * Emits event with the given value.
   */
  emit(value: T): void;
}

export function emitter<T>(async = false) {
  const observers = new Set<Observer<T>>();
  const subscriber = createSubscriber(observers);
  return {
    ...createObservable(subscriber, observers),
    emit(value: T) {
      if (async) {
        setTimeout(subscriber.next, undefined, value);
      } else {
        subscriber.next(value);
      }
    },
  };
}
