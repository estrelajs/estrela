import { StateSubject } from '../observables/state_subject'

export const REVANGE_STATES = new Set<StateSubject<any>>()

export const state = <T>(initialValue: T) => {
  const state = new StateSubject<T>(initialValue)
  REVANGE_STATES.add(state)
  return state
}
