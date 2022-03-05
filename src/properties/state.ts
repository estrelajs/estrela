import { StateSubject } from '../observables/state_subject';
import { ELEMENT_STATES } from './tokens';

export function state<T>(): StateSubject<T | undefined>;
export function state<T>(value: T): StateSubject<T>;
export function state(initialValue?: any): StateSubject<any> {
  const state = new StateSubject<any>(initialValue ?? undefined);
  ELEMENT_STATES.add(state);
  return state;
}
