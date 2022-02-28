import { Subscription } from 'rxjs';
import { EventEmitter } from '../observables/event_emitter';
import { StateSubject } from '../observables/state_subject';

export interface ElementProperties {
  emitters?: Record<string, EventEmitter<any>>;
  props?: Record<string, StateSubject<any>>;
  state?: StateSubject<any> | StateSubject<any>[];
  subscription?: Subscription | Subscription[];
}

export const ELEMENT_PROPERTIES = {
  properties: {},
} as {
  properties: ElementProperties;
};

export function setProperties(properties: ElementProperties) {
  ELEMENT_PROPERTIES.properties = { ...properties };
}
