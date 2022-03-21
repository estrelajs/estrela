import { merge, Observable, Subject, Subscription } from 'rxjs';
import { EventEmitter } from './observables/EventEmitter';
import { StateSubject } from './observables/StateSubject';
import {
  EstrelaElement,
  EstrelaElementEventMap,
  ElementProperties,
  EstrelaComponent,
} from '../types';
import { coerceArray, getElementProperty } from '../utils';
import { EMITTERS_TOKEN } from './properties/emitter';
import { PROPS_TOKEN } from './properties/prop';
import { PROPERTIES_TOKEN } from './properties/properties';
import { STATES_TOKEN } from './properties/state';
import { render } from './template/render';
import { ElementRef } from './element-ref';

/**
 * Define your Component as a Custom Element.
 *
 * @param name Element tag
 * @param component Estrela Component
 * @param styles list of css styles
 */
export function defineElement(
  name: string,
  component: EstrelaComponent,
  styles?: string | string[]
) {
  const Element = class extends HTMLElement implements EstrelaElement {
    // event observables
    readonly init$: Observable<Event>;
    readonly destroy$: Observable<Event>;

    // privates
    private readonly _events = new Set<Function>();
    private readonly _subscriptions = new Subscription();
    private _requestedRender = false;

    constructor() {
      super();

      // init shadow DOM
      // TODO: optional use shadow dom
      this.attachShadow({ mode: 'open' });

      // set styles
      (this.shadowRoot as any).adoptedStyleSheets = coerceArray(styles).map(css => {
        const sheet = new CSSStyleSheet(); // TODO: use polyfill
        (sheet as any).replaceSync(css);
        return sheet;
      });

      // set Element ref
      ElementRef.setComponent(component, this);

      // get component renderer function
      const componentRenderer = component(this);

      // clear Element ref
      ElementRef.clear();

      // define element renderer
      Reflect.defineMetadata(
        'render',
        () => {
          ElementRef.setComponent(component, this);
          this.dispatchEvent(new Event('prerender'));
          render(componentRenderer, this.shadowRoot ?? this);
          this.dispatchEvent(new Event('postrender'));
          ElementRef.clear();
        },
        this
      );

      // Get element states
      const elementStates: StateSubject<any>[] =
        Reflect.getMetadata(STATES_TOKEN, this) ?? [];

      // Get element props
      const propKeys: string[] = Reflect.getOwnMetadataKeys(this, PROPS_TOKEN) ?? [];
      const elementProps = propKeys.reduce((acc, key) => {
        acc[key] = Reflect.getOwnMetadata(key, this, PROPS_TOKEN);
        return acc;
      }, {} as Record<string, StateSubject<any>>);

      // Get element emitters
      const emitterKeys: string[] =
        Reflect.getOwnMetadataKeys(this, EMITTERS_TOKEN) ?? [];
      const elementEmitters = emitterKeys.reduce((acc, key) => {
        acc[key] = Reflect.getOwnMetadata(key, this, EMITTERS_TOKEN);
        return acc;
      }, {} as Record<string, StateSubject<any>>);

      // construct properties
      const {
        emitters = elementEmitters,
        props = elementProps,
        state = elementStates,
        ...others
      } = (Reflect.getOwnMetadata(PROPERTIES_TOKEN, this) as ElementProperties) ??
      {};
      const properties = {
        emitters,
        state,
        props,
        ...others,
      };

      // set properties metadata.
      Reflect.defineMetadata(PROPERTIES_TOKEN, properties, this);

      // add element subscriptions to the local one
      coerceArray(properties.subscription).forEach(sub =>
        this._subscriptions.add(sub)
      );

      // subscribe to states
      this._subscriptions.add(
        merge(
          ...coerceArray(getElementProperty(this, 'state')),
          ...Object.values(getElementProperty(this, 'props') ?? {})
        ).subscribe(() => this.requestRender())
      );

      // subscribe to emitters
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

      // start event observables
      this.init$ = this.on('init');
      this.destroy$ = this.on('destroy');

      // emit init
      this.dispatchEvent(new Event('init'));
    }

    connectedCallback(): void {
      // emit connect
      this.dispatchEvent(new Event('connect'));
      this.requestRender();
    }

    disconnectedCallback(): void {
      // emit disconnect
      this.dispatchEvent(new Event('disconnect'));

      if (!this.isConnected) {
        this._subscriptions.unsubscribe();
        this._events.forEach(complete => complete());
        this.dispatchEvent(new Event('destroy'));
      }
    }

    /** Creates an observable from the element event. */
    on<K extends keyof EstrelaElementEventMap>(
      event: K,
      options?: boolean | AddEventListenerOptions
    ): Observable<EstrelaElementEventMap[K]> {
      const subject = new Subject<EstrelaElementEventMap[K]>();
      const listener = (ev: any) => subject.next(ev);
      const completer = () => {
        this.removeEventListener(event as any, listener, options);
        subject.complete();
      };
      this.addEventListener(event as any, listener, options);
      this._events.add(completer);
      return subject.asObservable();
    }

    /** Request element render. */
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

  window.customElements.define(name, Element);
}
