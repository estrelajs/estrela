import { EventEmitter, StateSubject } from '../observables';
import { ElementProperties } from '../types';

export const CURRENT_ELEMENT: { element: Function } = { element: () => {} };
export const ELEMENT_EMITTERS = new Map<string, EventEmitter<any>>();
export const ELEMENT_PROPERTIES: { properties: ElementProperties } = {
  properties: {},
};
export const ELEMENT_PROPS = new Map<string, StateSubject<any>>();
export const ELEMENT_STATES = new Set<StateSubject<any>>();
