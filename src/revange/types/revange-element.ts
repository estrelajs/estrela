import { ElementProperties } from '../element/set-properties'
import { HTMLResult } from '../template/html-result'

interface RevangeElementEventMap extends HTMLElementEventMap {
  destroy: Event
}

export interface RevangeElement extends HTMLElement {
  /** @internal */
  _elementRef: {
    properties: ElementProperties
    render(): HTMLResult | null
  }

  addEventListener<K extends keyof RevangeElementEventMap>(
    type: K,
    listener: (this: RevangeElement, ev: RevangeElementEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions
  ): void

  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): void

  requestRender(): void
}
