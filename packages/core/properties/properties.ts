import { ElementProperties } from '../../types';
import { ElementRef } from '../element-ref';

export const PROPERTIES_TOKEN = Symbol('PROPERTIES_TOKEN');

export function setProperties(properties: Partial<ElementProperties>) {
  const ref = ElementRef.ref;

  if (!ref?.element || !ref?.component) {
    throw new Error(
      'Out of context error! You cannot set properties from outside of a component scope.'
    );
  }

  Reflect.defineMetadata(PROPERTIES_TOKEN, properties, ref.element);
}
