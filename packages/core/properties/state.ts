import { ElementRef } from '../element-ref';
import { StateSubject } from '../observables/StateSubject';

export const STATES_TOKEN = Symbol('STATES_TOKEN');

export function state<T>(): StateSubject<T | undefined>;
export function state<T>(value: T): StateSubject<T>;
export function state(initialValue?: any): StateSubject<any> {
  const ref = ElementRef.ref;

  if (!ref?.element || !ref?.component) {
    throw new Error(
      'Out of context error! You cannot create state from outside of a component scope.'
    );
  }

  const state = new StateSubject<any>(initialValue ?? undefined);
  const states = Reflect.getMetadata(STATES_TOKEN, ref.element) ?? [];

  states.push(state);
  Reflect.defineMetadata(STATES_TOKEN, states, ref.element);

  return state;
}
