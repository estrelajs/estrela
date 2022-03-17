import { Subject } from 'rxjs';
import { PROPERTIES_TOKEN } from '../core/properties/properties';
import { ElementProperties } from '../types/ElementProperties';
import { isObserver } from './observables';

/** Add event listener to element and return a remover function. */
export function addEventListener<T>(
  element: Element,
  event: string,
  listener: (e: T) => void | Subject<T>
): () => void {
  const hook = (event: unknown) => {
    const data = event instanceof CustomEvent ? event.detail : event;
    if (isObserver(listener)) {
      listener.next(data);
    }
    if (typeof listener === 'function') {
      listener(data);
    }
  };
  element.addEventListener(event, hook);
  return () => element.removeEventListener(event, hook);
}

/** Get reflected value from element properties. */
export function getElementProperty<K extends keyof ElementProperties>(
  element: Element,
  key: K
): ElementProperties[K] | undefined {
  const properties = Reflect.getOwnMetadata(
    PROPERTIES_TOKEN,
    element
  ) as ElementProperties;
  return properties?.[key];
}
