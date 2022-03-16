import { Observable } from 'rxjs';
import { CustomElementEventMap } from '../types';
import { CURRENT_ELEMENT } from './token';

/** Creates an observable from the element event. */
export function onEvent<K extends keyof CustomElementEventMap>(
  event: K,
  options?: boolean | AddEventListenerOptions
): Observable<CustomElementEventMap[K]> {
  return CURRENT_ELEMENT.context.on(event, options);
}
