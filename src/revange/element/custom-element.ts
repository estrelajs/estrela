import { merge, Subscription } from 'rxjs'
import { EventEmitter } from '../observables/event_emitter'
import { HTMLResult } from '../template/html-result'
import { render } from '../template/render'
import { FE } from '../types/functional-element'
import { coerceArray } from '../utils/coerce-array'
import { ElementProperties, REVANGE_PROPERTIES } from './set-properties'

export function defineElement(name: string, element: FE) {
  const CustomElement = class extends HTMLElement {
    private _elementRef: {
      properties: ElementProperties
      render(): HTMLResult | null
    }
    private _requestedRender = false
    private readonly _subscriptions = new Subscription()

    constructor() {
      super()

      const render = element(this)
      const properties = REVANGE_PROPERTIES.properties
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
      render(this._elementRef.render(), this.shadowRoot!)
    }
  }

  window.customElements.define(name, CustomElement)
}
