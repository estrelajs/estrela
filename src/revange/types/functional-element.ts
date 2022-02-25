import { StateSubject } from '../observables/state_subject'
import { HTMLResult } from '../template/html-result'

export interface ElementProperties {
  states?: Record<string, StateSubject<any>>
}

export interface FE {
  (setProperties: (properties: ElementProperties) => void): {
    (): HTMLResult
  }
}
