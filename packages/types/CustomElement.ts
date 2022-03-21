import { Observable } from 'rxjs';
import { HTMLTemplateLike } from './HTMLTemplateLike';

export type AttrBind<T = any> = {
  attr: string;
  data: T;
  filter?: string;
  target?: string;
  cleanup?: () => void;
};

export type AttrHandlerName =
  | 'bind'
  | 'class'
  | 'classbind'
  | 'default'
  | 'event'
  | 'key'
  | 'prop'
  | 'ref'
  | 'style'
  | 'stylebind';

export interface ChangeEvent<T extends HTMLElement> extends Event {
  target: T;
}

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
  connect: Event;
  destroy: Event;
  disconnect: Event;
  init: Event;
  postrender: Event;
  prerender: Event;
}

/** Estrela custom HTML element reference. */
export interface EstrelaElement extends HTMLElement {
  /** Emits when Element is initialized. */
  readonly init$: Observable<Event>;

  /** Emits when Element is destroyed. */
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
