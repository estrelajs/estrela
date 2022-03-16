import { merge, Observable, Subject, Subscription } from 'rxjs';
import { render } from '../template';
import { CURRENT_ELEMENT } from './token';
import {
  CustomElement,
  CustomElementEventMap,
  ElementProperties,
  FunctionalElement,
} from '../types';
import { coerceArray, getElementProperty } from '../utils';
import { EventEmitter, StateSubject } from '../observables';

export function defineElement(
  name: string,
  element: FunctionalElement,
  styles?: string | string[]
) {
  const CustomElement = class extends HTMLElement implements CustomElement {
    private readonly _eventSubscriptions = new Set<Function>();
    private readonly _subscriptions = new Subscription();
    private _requestedRender = false;

    constructor() {
      super();

      // set context reference
      CURRENT_ELEMENT.context = this;
      CURRENT_ELEMENT.element = element;

      // init shadow DOM
      this.attachShadow({ mode: 'open' });

      // set styles
      (this.shadowRoot as any).adoptedStyleSheets = coerceArray(styles).map(css => {
        const sheet = new CSSStyleSheet(); // TODO: use polyfill
        (sheet as any).replaceSync(css);
        return sheet;
      });

      // get element template getter
      const getElementTemplate = element(this);

      // define element renderer
      Reflect.defineMetadata(
        'render',
        () => {
          this.dispatchEvent(new Event('prerender'));
          render(getElementTemplate(), this.shadowRoot!);
          this.dispatchEvent(new Event('postrender'));
        },
        this
      );

      // Get element states
      const elementStates: StateSubject<any>[] =
        Reflect.getMetadata('states', this) ?? [];

      // Get element props
      const propKeys: string[] = Reflect.getOwnMetadataKeys(this, 'props');
      const elementProps = propKeys.reduce((acc, key) => {
        acc[key] = Reflect.getOwnMetadata(key, this, 'props');
        return acc;
      }, {} as Record<string, StateSubject<any>>);

      // Get element emitters
      const emitterKeys: string[] = Reflect.getOwnMetadataKeys(this, 'emitters');
      const elementEmitters = emitterKeys.reduce((acc, key) => {
        acc[key] = Reflect.getOwnMetadata(key, this, 'emitters');
        return acc;
      }, {} as Record<string, StateSubject<any>>);

      // construct properties
      const {
        emitters = elementEmitters,
        props = elementProps,
        state = elementStates,
        ...others
      } = (Reflect.getOwnMetadata('properties', this) as ElementProperties) ?? {};

      const properties = {
        emitters,
        state,
        props,
        ...others,
      };

      // set element ref
      Reflect.defineMetadata('properties', properties, this);

      // add element subscriptions to the local one
      coerceArray(properties.subscription).forEach(sub =>
        this._subscriptions.add(sub)
      );
    }

    connectedCallback(): void {
      this.requestRender();
      this.dispatchEvent(new Event('init'));

      // subscribe to emitters
      const emitters = getElementProperty(this, 'emitters') ?? {};
      Object.keys(emitters).forEach(key => {
        const emitter = emitters[key];
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
        ...coerceArray(getElementProperty(this, 'state')),
        ...Object.values(getElementProperty(this, 'props') ?? {}),
      ];

      this._subscriptions.add(
        merge(...observables).subscribe(() => this.requestRender())
      );
    }

    disconnectedCallback(): void {
      this.dispatchEvent(new Event('destroy'));
      this._subscriptions.unsubscribe();
      this._eventSubscriptions.forEach(complete => complete());
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
      this._eventSubscriptions.add(completer);
      return subject.asObservable();
    }

    requestRender(): void {
      if (this.isConnected && !this._requestedRender) {
        this._requestedRender = true;
        requestAnimationFrame(() => {
          this._requestedRender = false;
          Reflect.getMetadata('render', this)();
        });
      }
    }
  };

  window.customElements.define(name, CustomElement);
}
