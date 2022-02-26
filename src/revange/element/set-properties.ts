import { Subscription } from 'rxjs'
import { EventEmitter } from '../observables/event_emitter'
import { StateSubject } from '../observables/state_subject'

export interface ElementProperties {
  emitters?: Record<string, EventEmitter<any>>
  props?: Record<string, StateSubject<any>>
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
