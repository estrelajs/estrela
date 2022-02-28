import { StateSubject } from '../observables/state_subject';

export const prop = <T>(defaultValue?: T) =>
  new StateSubject<T | undefined>(defaultValue);
