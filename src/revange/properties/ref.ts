import { StateSubject } from '../observables/state_subject'

export const ref = <T>() => new StateSubject<T | undefined>(undefined)
