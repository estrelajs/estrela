import { merge, Subscription } from 'rxjs'
import { REVANGE_STATES } from '..'
import { EventEmitter } from '../observables/event_emitter'
import { HTMLResult } from '../template/html-result'
import { render } from '../template/render'
import { CustomElement } from '../types/custom-element'
import { FE } from '../types/functional-element'
import { coerceArray } from '../utils/coerce-array'
import { ElementProperties, REVANGE_PROPERTIES } from './set-properties'

export function defineElement(name: string, element: FE) {
  const CustomElement = class extends HTMLElement implements CustomElement {
    _elementRef: {
      properties: ElementProperties
      render(): HTMLResult | null
    }

    private _requestedRender = false
    private readonly _subscriptions = new Subscription()

    constructor() {
      super()

      REVANGE_STATES.clear()
      const render = element(this)
      const properties = {
        state: Array.from(REVANGE_STATES.values()),
        ...REVANGE_PROPERTIES.properties,
      }
      this._elementRef = {
        properties,
        render,
      }

      // subscribe emitters
      Object.keys(properties.emitters ?? {}).forEach(key => {
        const emitter = properties.emitters?.[key]
        if (emitter instanceof EventEmitter) {
          this._subscriptions.add(
            emitter.subscribe(value =>
              this.dispatchEvent(new CustomEvent(key, { detail: value }))
            )
          )
        }
      })

      // subscribe states
      this._subscriptions.add(
        merge(...coerceArray(properties.state)).subscribe(() => this.requestRender())
      )

      // subscribe subscriptions
      coerceArray(properties.subscription).forEach(sub =>
        this._subscriptions.add(sub)
      )
    }

    connectedCallback(): void {
      this.attachShadow({ mode: 'open' })
      this.requestRender()
    }

    disconnectedCallback(): void {
      this._subscriptions.unsubscribe()
      this.dispatchEvent(new Event('destroy'))
    }

    requestRender(): void {
      if (this.isConnected && !this._requestedRender) {
        this._requestedRender = true
        requestAnimationFrame(() => {
          this._requestedRender = false
          this._render()
        })
      }
    }

    private _render(): void {
      this.dispatchEvent(new Event('prerender'))
      render(this._elementRef.render(), this.shadowRoot!)
      this.dispatchEvent(new Event('postrender'))
    }
  }

  window.customElements.define(name, CustomElement)
}
