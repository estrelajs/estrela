import { merge, Subscription } from 'rxjs'
import { HTMLResult } from '../template/html-result'
import { render } from '../template/render'
import { FE } from '../types/functional-element'
import { ElementProperties, REVANGE_PROPERTIES } from './set-properties'

export function defineElement(name: string, element: FE) {
  const CustomElement = class extends HTMLElement {
    private _elementRef: {
      properties: ElementProperties
      render(): HTMLResult
    }
    private _requestedRender = false
    private readonly _statesSubscription: Subscription

    constructor() {
      super()
      this.attachShadow({ mode: 'open' })

      const render = element(this)
      const properties = REVANGE_PROPERTIES.properties
      this._elementRef = {
        properties,
        render,
      }

      this._statesSubscription = merge(...(properties.states ?? [])).subscribe(() =>
        this.requestRender()
      )

      this.requestRender()
    }

    disconnectedCallback() {
      this._statesSubscription.unsubscribe()
      const subscriptions =
        this._elementRef.properties.subscription instanceof Subscription
          ? [this._elementRef.properties.subscription]
          : this._elementRef.properties.subscription
      subscriptions?.forEach(subscription => subscription.unsubscribe())
    }

    requestRender(): void {
      if (!this._requestedRender) {
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
