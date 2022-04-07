import { createObservable } from './mixins';
import { Observable } from './observable';

export interface EventEmitter<T> extends Observable<T> {
  /**
   * Emits event with the given value.
   */
  emit(value: T): void;
}

export function emitter<T>(async = false) {
  const [obsevable, subscriber] = createObservable();
  return {
    ...obsevable,
    emit(value: T) {
      if (async) {
        setTimeout(subscriber.next, undefined, value);
      } else {
        subscriber.next(value);
      }
    },
  };
}
