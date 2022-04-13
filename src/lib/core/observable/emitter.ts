import { ComponentRef } from '../../directives';
import { createObservable } from './mixins';
import { Observable } from './observable';

export interface EventEmitter<T> extends Observable<T> {
  /**
   * Emits event with the given value.
   */
  emit(value: T): void;
}

export function emitter<T>(eventName: string, async = false): EventEmitter<T> {
  const [obsevable, subscriber] = createObservable();
  const instance: EventEmitter<T> = {
    ...obsevable,
    emit(value: T) {
      if (async) {
        setTimeout(subscriber.next, undefined, value);
      } else {
        subscriber.next(value);
      }
    },
  };
  if (ComponentRef.currentRef) {
    ComponentRef.currentRef.pushEmitter(eventName, instance);
  }
  return instance;
}
