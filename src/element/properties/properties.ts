import { ElementProperties } from '../../types';
import { CURRENT_ELEMENT } from '../token';

export const PROPERTIES_TOKEN = Symbol('PROPERTIES_TOKEN');

export function setProperties(properties: ElementProperties) {
  Reflect.defineMetadata(PROPERTIES_TOKEN, properties, CURRENT_ELEMENT.context);
}
