import { Subject } from 'rxjs';
import { ElementProperties } from '../types/ElementProperties';
import { isObserver } from './observables';

/** Add event listener to element and return a remover function. */
export function addEventListener(
  element: Element,
  event: string,
  listener: Function | Subject<unknown>
): () => void {
  const hook = (event: unknown) => {
    const data = event instanceof CustomEvent ? event.detail : event;
    if ((listener as any).next) {
      (listener as any).next(data);
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
    'properties',
    element
  ) as ElementProperties;
  return properties?.[key];
}

/** Try to bind element prop value if exists. */
export function tryToBindPropValue(el: Element, propName: string, value: any) {
  const prop = getElementProperty(el, 'props')?.[propName];
  if (prop && isObserver(prop)) {
    prop.next(value);
  }
}
