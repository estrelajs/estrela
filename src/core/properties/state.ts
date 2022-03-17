import { StateSubject } from '../../observables/StateSubject';
import { CONTEXT } from '../context';

export const STATES_TOKEN = Symbol('STATES_TOKEN');

export function state<T>(): StateSubject<T | undefined>;
export function state<T>(value: T): StateSubject<T>;
export function state(initialValue?: any): StateSubject<any> {
  const state = new StateSubject<any>(initialValue ?? undefined);
  const states = Reflect.getMetadata(STATES_TOKEN, CONTEXT.instance) ?? [];
  states.push(state);
  Reflect.defineMetadata(STATES_TOKEN, states, CONTEXT.instance);
  return state;
}
