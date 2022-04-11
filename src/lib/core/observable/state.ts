import { ComponentRef } from '../../directives';
import { createObservable } from './mixins';
import { Observable } from './observable';

export interface ObservableState<T> extends Observable<T> {
  /** Current state value. */
  (): T;

  /**
   * Updates the current state.
   * @param value next value.
   */
  next(value: T): void;

  /**
   * Updates the current state based on the last value.
   * @param updater callback function to update current state.
   */
  update(updater: (value: T) => T): void;
}

export function state<T>(): ObservableState<T | undefined>;
export function state<T>(initialValue: T): ObservableState<T>;
export function state(initialValue?: any): ObservableState<any> {
  let value = initialValue ?? undefined;
  const [obsevable, subscriber] = createObservable();
  const descriptor = {
    ...obsevable,
    next(next: any) {
      subscriber.next((value = next));
    },
    update(setter: (value: any) => any) {
      this.next((value = setter(value)));
    },
  };
  const valueGetter = function _state() {
    return value;
  };
  const instance = Object.assign(valueGetter, descriptor);
  ComponentRef.currentRef?.pushState(instance);
  return instance;
}
