import { merge, Observable, Subject, Subscription } from 'rxjs';
import { EventEmitter } from '../observables';
import {
  ELEMENT_PROPS,
  ELEMENT_STATES,
  CURRENT_ELEMENT,
  ELEMENT_PROPERTIES,
  ELEMENT_EMITTERS,
} from '../properties/tokens';
import { HTMLResult, render } from '../template';
import {
  CustomElement,
  CustomElementEventMap,
  ElementProperties,
  Fel,
} from '../types';
import { coerceArray } from '../utils';

export function defineElement(
  name: string,
  element: Fel,
  styles?: string | string[]
) {
  const CustomElement = class extends HTMLElement implements CustomElement {
    readonly _completers = new Set<Function>();
    readonly _elementRef: {
      properties: ElementProperties;
      render(): HTMLResult | null;
    };
    private _requestedRender = false;
    private readonly _subscriptions = new Subscription();

    constructor() {
      super();

      // init shadow DOM
      this.attachShadow({ mode: 'open' });

      // set styles
      (this.shadowRoot as any).adoptedStyleSheets = coerceArray(styles).map(css => {
        const sheet = new CSSStyleSheet(); // TODO: use polyfill
        (sheet as any).replaceSync(css);
        return sheet;
      });

      // clear tokens
      CURRENT_ELEMENT.context = this;
      CURRENT_ELEMENT.element = element;
      ELEMENT_EMITTERS.clear();
      ELEMENT_PROPS.clear();
      ELEMENT_STATES.clear();

      // get Element render function
      const render = element(this);

      // Get element properties
      const elementEmitters = Object.fromEntries(ELEMENT_EMITTERS.entries());
      const elementProps = Object.fromEntries(ELEMENT_PROPS.entries());
      const elementStates = Array.from(ELEMENT_STATES.values());
      const {
        emitters = elementEmitters,
        props = elementProps,
        state = elementStates,
        ...others
      } = ELEMENT_PROPERTIES.properties;
      const properties = {
        emitters,
        state,
        props,
        ...others,
      };

      // add element subscriptions to the local one
      coerceArray(properties.subscription).forEach(sub =>
        this._subscriptions.add(sub)
      );

      // set element ref
      this._elementRef = {
        properties,
        render,
      };
    }

    connectedCallback(): void {
      this.requestRender();
      this.dispatchEvent(new Event('init'));

      // subscribe to emitters
      Object.keys(this._elementRef.properties.emitters ?? {}).forEach(key => {
        const emitter = this._elementRef.properties.emitters?.[key];
        if (emitter instanceof EventEmitter) {
          const subscription = emitter.subscribe(value => {
            const event = new CustomEvent(key, { detail: value });
            this.dispatchEvent(event);
          });
          this._subscriptions.add(subscription);
        } else {
          console.error(
            `Typer error! Emitter "${key}" on "${this.localName}" should be instance of EventEmitter.`
          );
        }
      });

      // subscribe to states
      const observables = [
        ...coerceArray(this._elementRef.properties.state),
        ...Object.values(this._elementRef.properties.props ?? {}),
      ];
      this._subscriptions.add(
        merge(...observables).subscribe(() => this.requestRender())
      );
    }

    disconnectedCallback(): void {
      this.dispatchEvent(new Event('destroy'));
      this._subscriptions.unsubscribe();
      this._completers.forEach(complete => complete());
    }

    on<K extends keyof CustomElementEventMap>(
      event: K,
      options?: boolean | AddEventListenerOptions
    ): Observable<CustomElementEventMap[K]> {
      const subject = new Subject<CustomElementEventMap[K]>();
      const listener = (ev: any) => subject.next(ev);
      const completer = () => {
        this.removeEventListener(event as any, listener, options);
        subject.complete();
      };
      this.addEventListener(event as any, listener, options);
      this._completers.add(completer);
      return subject.asObservable();
    }

    requestRender(): void {
      if (this.isConnected && !this._requestedRender) {
        this._requestedRender = true;
        requestAnimationFrame(() => {
          this._requestedRender = false;
          this._render();
        });
      }
    }

    private _render(): void {
      this.dispatchEvent(new Event('prerender'));
      render(this._elementRef.render(), this.shadowRoot!);
      this.dispatchEvent(new Event('postrender'));
    }
  };

  window.customElements.define(name, CustomElement);
}
