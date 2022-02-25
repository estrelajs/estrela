import { StateSubject } from '../observables/state_subject'

export const state = <T>(initialValue: T) => new StateSubject<T>(initialValue)
