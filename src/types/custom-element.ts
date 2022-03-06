import { Observable } from 'rxjs';
import { HTMLResult } from '../template/html-result';
import { ElementProperties } from './element-properties';

export interface CustomElementEventMap extends HTMLElementEventMap {
  destroy: Event;
  init: Event;
  prerender: Event;
  postrender: Event;
}

/** Custom HTML Element Reference */
export interface CustomElement extends HTMLElement {
  /** @internal */
  _elementRef: {
    properties: ElementProperties;
    render(): HTMLResult | null;
  };

  addEventListener<K extends keyof CustomElementEventMap>(
    type: K,
    listener: (this: CustomElement, ev: CustomElementEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions
  ): void;

  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): void;

  on<K extends keyof CustomElementEventMap>(
    event: K,
    options?: boolean | AddEventListenerOptions
  ): Observable<CustomElementEventMap[K]>;

  requestRender(): void;
}
