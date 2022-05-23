import { ComponentRef } from './internal';
import { State, isState, createState } from './observables';
import { ProxyState } from './proxy-state';

/** Get the state reference of a local variable. */
export function getState<T>(state: T): State<T>;
/** Get the state reference from a proxy state. */
export function getState<T>(state: ProxyState<T>, name: keyof T): State<T>;
export function getState(state: any, name?: any): State<any> {
  return name && isState(state?.$?.[name]) ? state.$[name] : createState(state);
}

export function onDestroy(callback: () => void): void {
  ComponentRef.currentRef?.pushHook('destroy', callback);
}

export function setRef<T>(ref: T): void {
  ComponentRef.currentRef?.setRef(ref);
}
