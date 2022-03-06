import { Observable } from 'rxjs';
import { CURRENT_ELEMENT } from '../properties/tokens';
import { CustomElementEventMap } from '../types';

export function onEvent<K extends keyof CustomElementEventMap>(
  event: K,
  options?: boolean | AddEventListenerOptions
): Observable<CustomElementEventMap[K]> {
  return CURRENT_ELEMENT.context.on(event, options);
}
