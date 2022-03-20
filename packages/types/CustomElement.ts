import { Observable } from 'rxjs';
import { HTMLTemplate } from '../core';
import { HTMLTemplateLike } from './HTMLTemplateLike';

export type AttrBind<T = any> = {
  attr: string;
  data: T;
  filter?: string;
  cleanup?: () => void;
};

export type AttrHandlerName =
  | 'bind'
  | 'class'
  | 'classbind'
  | 'default'
  | 'event'
  | 'prop'
  | 'ref'
  | 'style'
  | 'stylebind';

/** Render function. Will be called on every render cycle. */
export interface ComponentRender {
  (): HTMLTemplateLike;
}

/** Estrela Component Definition. */
export interface EstrelaComponent {
  (host: EstrelaElement): ComponentRender;
}

/** Estrela Element Events. */
export interface EstrelaElementEventMap extends HTMLElementEventMap {
  destroy: Event;
  init: Event;
  prerender: Event;
  postrender: Event;
}

/** Estrela custom HTML element reference. */
export interface EstrelaElement extends HTMLElement {
  /** Emits when Element is connected. */
  readonly init$: Observable<Event>;

  /** Emits when Element is disconnected. */
  readonly destroy$: Observable<Event>;

  addEventListener<K extends keyof EstrelaElementEventMap>(
    type: K,
    listener: (this: EstrelaElement, ev: EstrelaElementEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions
  ): void;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): void;

  /** Create an observable from events. */
  on<K extends keyof EstrelaElementEventMap>(
    event: K,
    options?: boolean | AddEventListenerOptions
  ): Observable<EstrelaElementEventMap[K]>;

  /** Request template to be re-rendered in the next tick. */
  requestRender(): void;
}
