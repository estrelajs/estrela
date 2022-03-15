import { CURRENT_ELEMENT } from '../element/token';
import { ElementProperties } from '../types';

export function setProperties(properties: ElementProperties) {
  Reflect.defineMetadata('properties', CURRENT_ELEMENT.context, properties);
}
