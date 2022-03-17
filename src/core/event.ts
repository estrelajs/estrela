import { Observable } from 'rxjs';
import { CustomElementEventMap } from '../types';
import { CURRENT_ELEMENT } from './token';

/** Creates an observable event listener for the current element. */
export function onEvent<K extends keyof CustomElementEventMap>(
  event: K,
  options?: boolean | AddEventListenerOptions
): Observable<CustomElementEventMap[K]> {
  return CURRENT_ELEMENT.context.on(event, options);
}
