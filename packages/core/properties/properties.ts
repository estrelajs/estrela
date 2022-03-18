import { ElementProperties } from '../../types';
import { CONTEXT } from '../context';

export const PROPERTIES_TOKEN = Symbol('PROPERTIES_TOKEN');

export function setProperties(properties: ElementProperties) {
  Reflect.defineMetadata(PROPERTIES_TOKEN, properties, CONTEXT.instance);
}
