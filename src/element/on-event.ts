import { Observable } from 'rxjs';
import { CURRENT_ELEMENT } from './token';
import { CustomElementEventMap } from '../types';

/** Creates an observable from the element event. */
export function onEvent<K extends keyof CustomElementEventMap>(
  event: K,
  options?: boolean | AddEventListenerOptions
): Observable<CustomElementEventMap[K]> {
  return CURRENT_ELEMENT.context.on(event, options);
}
