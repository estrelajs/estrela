import { Observable } from 'rxjs';
import { EstrelaElementEventMap } from '../types';
import { ElementRef } from './element-ref';

/** Creates an observable event listener for the current element. */
export function onEvent<K extends keyof EstrelaElementEventMap>(
  event: K,
  options?: boolean | AddEventListenerOptions
): Observable<EstrelaElementEventMap[K]> {
  const ref = ElementRef.ref;

  if (!ref?.element) {
    throw new Error(
      'Out of context error! You cannot call event from outside of a component scope.'
    );
  }

  return ref.element.on(event, options);
}
