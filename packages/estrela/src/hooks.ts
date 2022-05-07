import { ComponentRef } from './internal';
import { createState, isState, State } from './observables';

export function $<T>(state: T): State<T> {
  return isState<T>(state) ? state : createState(state);
}

export function onDestroy(callback: () => void): void {
  ComponentRef.currentRef?.pushHook('destroy', callback);
}
