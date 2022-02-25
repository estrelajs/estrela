import { Subscription } from 'rxjs'
import { StateSubject } from '../observables/state_subject'

export interface ElementProperties {
  states?: StateSubject<any>[]
  subscription?: Subscription | Subscription[]
}

export const REVANGE_PROPERTIES = {
  properties: {},
} as {
  properties: ElementProperties
}

export function setProperties(properties: ElementProperties) {
  REVANGE_PROPERTIES.properties = { ...properties }
}
