import { ElementProperties } from '../element/set-properties';
import { HTMLResult } from '../template/html-result';

interface CustomElementEventMap extends HTMLElementEventMap {
  destroy: Event;
  prerender: Event;
  postrender: Event;
}

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

  requestRender(): void;
}
