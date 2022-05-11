import { createState, isState, State } from './observables';

/** Get the state reference of a local variable. */
export function getState<T>(state: T): State<T>;
/** @internal */
export function getState<T>(state: T, name: keyof T): State<T>;
export function getState(state: any, name?: any): State<any> {
  return name && isState(state?.$?.[name]) ? state.$[name] : createState(state);
}
