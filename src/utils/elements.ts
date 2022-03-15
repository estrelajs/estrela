import { Subject } from 'rxjs';
import { ElementProperties } from '../types/element-properties';

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

export function getProperty<K extends keyof ElementProperties>(
  element: Element,
  key: K
): ElementProperties[K] | undefined {
  const properties: ElementProperties = Reflect.getOwnMetadata(
    'properties',
    element
  );
  return properties?.[key];
}
