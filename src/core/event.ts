import { Observable } from 'rxjs';
import { CustomElementEventMap } from '../types';
import { CONTEXT } from './context';

/** Creates an observable event listener for the current element. */
export function onEvent<K extends keyof CustomElementEventMap>(
  event: K,
  options?: boolean | AddEventListenerOptions
): Observable<CustomElementEventMap[K]> {
  return CONTEXT.instance.on(event, options);
}
