import { merge } from 'rxjs'
import { HTMLResult } from '../template/html-result'
import { render } from '../template/render'
import { ElementProperties, FE } from '../types/functional-element'

export function defineElement(name: string, element: FE) {
  const CustomElement = class extends HTMLElement {
    private elementRef: {
      properties: ElementProperties
      render(): HTMLResult
    }

    private _requestedRender = false

    constructor() {
      super()
      this.attachShadow({ mode: 'open' })

      let properties: ElementProperties = {}
      const setProperties = (props: ElementProperties) => (properties = props)
      const render = element(setProperties)

      this.elementRef = {
        properties,
        render,
      }

      merge(...Object.values(properties.states ?? {})).subscribe(() =>
        this.requestRender()
      )

      this.requestRender()
    }

    requestRender(): void {
      if (!this._requestedRender) {
        setTimeout(() => {
          this._requestedRender = false
          this.render()
        })
      }
    }

    private render(): void {
      render(this.elementRef.render(), this.shadowRoot!)
    }
  }
  window.customElements.define(name, CustomElement)
}
