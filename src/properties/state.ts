import { StateSubject } from '../observables/state_subject';
import { CURRENT_ELEMENT } from '../element/token';

export function state<T>(): StateSubject<T | undefined>;
export function state<T>(value: T): StateSubject<T>;
export function state(initialValue?: any): StateSubject<any> {
  const state = new StateSubject<any>(initialValue ?? undefined);
  const states = Reflect.getMetadata('states', CURRENT_ELEMENT.context) ?? [];
  states.push(state);
  Reflect.defineMetadata('states', states, CURRENT_ELEMENT.context);
  return state;
}
