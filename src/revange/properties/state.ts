import { StateSubject } from '../observables/state_subject';

export const ELEMENT_STATES = new Set<StateSubject<any>>();

export function state<T>(): StateSubject<T | undefined>;
export function state<T>(value: T): StateSubject<T>;
export function state(initialValue?: any) {
  const state = new StateSubject<any>(initialValue ?? undefined);
  ELEMENT_STATES.add(state);
  return state;
}
