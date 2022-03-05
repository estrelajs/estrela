import { ELEMENT_PROPERTIES } from '../properties/tokens';
import { ElementProperties } from '../types';

export function setProperties(properties: ElementProperties) {
  ELEMENT_PROPERTIES.properties = { ...properties };
}
