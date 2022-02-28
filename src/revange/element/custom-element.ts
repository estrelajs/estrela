import { merge, Subscription } from 'rxjs';
import { EventEmitter } from '../observables/event_emitter';
import { ELEMENT_STATES } from '../properties/state';
import { HTMLResult } from '../template/html-result';
import { render } from '../template/render';
import { CustomElement } from '../types/custom-element';
import { FE } from '../types/functional-element';
import { coerceArray } from '../utils/coerce-array';
import { ElementProperties, ELEMENT_PROPERTIES } from './set-properties';

export function defineElement(name: string, element: FE) {
  const CustomElement = class extends HTMLElement implements CustomElement {
    readonly _elementRef: {
      properties: ElementProperties;
      render(): HTMLResult | null;
    };

    private _initiated = false;
    private _requestedRender = false;
    private readonly _subscriptions = new Subscription();

    constructor() {
      super();
      ELEMENT_STATES.clear();

      // Element render function
      const render = element(this);

      // Get element properties
      const { state, ...others } = ELEMENT_PROPERTIES.properties;
      coerceArray(state).forEach(_state => ELEMENT_STATES.add(_state));
      const properties = {
        ...others,
        state: Array.from(ELEMENT_STATES.values()),
      };

      // subscribe emitters
      Object.keys(properties.emitters ?? {}).forEach(key => {
        const emitter = properties.emitters?.[key];
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

      // subscribe states
      this._subscriptions.add(
        merge(...coerceArray(properties.state)).subscribe(() => this.requestRender())
      );

      // subscribe subscriptions
      coerceArray(properties.subscription).forEach(sub =>
        this._subscriptions.add(sub)
      );

      this._elementRef = {
        properties,
        render,
      };
    }

    connectedCallback(): void {
      this.attachShadow({ mode: 'open' });
      this.requestRender();
    }

    disconnectedCallback(): void {
      this.dispatchEvent(new Event('destroy'));
      this._subscriptions.unsubscribe();
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
      if (!this._initiated) {
        this.dispatchEvent(new Event('init'));
        this._initiated = true;
      }

      this.dispatchEvent(new Event('prerender'));
      render(this._elementRef.render(), this.shadowRoot!);
      this.dispatchEvent(new Event('postrender'));
    }
  };

  window.customElements.define(name, CustomElement);
}
