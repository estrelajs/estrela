import morphdom from '../morphdom'
import { EventEmitter } from '../observables/event_emitter'
import { StateSubject } from '../observables/state_subject'
import { html } from '../template/html-directive'
import { addEventListener } from '../utils/add-event-listener'
import { HTMLResult } from './html-result'

interface HTMLRender {
  html: string
  args: any[]
}

const getResult = (template: string | HTMLResult): HTMLResult => {
  return typeof template === 'string' ? html`${template}` : template
}

const htmlRender = (result: HTMLResult, args: any[] = []): HTMLRender => {
  const html = result.template
    .map((str, i) => {
      const arg = result.args[i]
      if (i >= result.args.length) {
        return str
      }
      if (/\s((on)?:\w+|ref)=\"?$/.test(str)) {
        let index = args.indexOf(arg)
        if (index === -1) {
          index = args.push(arg) - 1
        }
        return str + index
      }
      if (arg instanceof HTMLResult || Array.isArray(arg)) {
        const results = Array.isArray(arg) ? arg : [arg]
        return str + results.map(_arg => htmlRender(_arg, args).html).join('')
      }
      let data = String(arg === false ? '' : arg ?? '')
      const [match, quotes] = /=(\")?$/.exec(str)?.values() ?? []
      if (!match) {
        data = `<!---->${data}<!---->`
      } else if (!quotes) {
        data = `"${data}"`
      }
      return str + data
    })
    .join('')
    .trim()
  return { html, args }
}

const ELEMENT_LISTENERS = new Map<Element, (() => void)[]>()
const ELEMENT_KEYS = new Map<Element, string>()

export function render(
  template: string | HTMLResult | null,
  element: HTMLElement | DocumentFragment
) {
  if (template === null) {
    return
  }

  const { html, args } = htmlRender(getResult(template))

  // patch changes
  morphdom(element, `<div>${html}</div`, {
    childrenOnly: true,
    getNodeKey(node) {
      const el = node as Element
      const attr = el.getAttribute?.('key')
      const key = ELEMENT_KEYS.get(el)
      return attr ?? key ?? el.id
    },
    onNodeAdded(node) {
      const el = node as Element
      const key = el.getAttribute?.('key')
      const ref = el.getAttribute?.('ref')

      if (key) {
        ELEMENT_KEYS.set(el, key)
        el.removeAttribute('key')
      }

      if (ref) {
        const refState: StateSubject<any> = args[Number(ref)]
        el.removeAttribute('ref')
        refState.next(node)
      }

      Array.from(el.attributes ?? []).forEach(attr => {
        // bind event listeners
        if (attr.name.startsWith('on:')) {
          let listener: (() => void) | null = null
          const arg = args[Number(attr.value)]
          const propName = attr.name.replace('on:', '')
          const emitter: EventEmitter<any> = (node as any)._elementRef?.properties
            ?.emitters?.[propName]

          if (emitter) {
            listener = addEventListener(emitter, arg)
          } else {
            listener = addEventListener(el, arg, propName)
          }

          if (listener) {
            const listeners = ELEMENT_LISTENERS.get(el) ?? []
            listeners.push(listener)
            ELEMENT_LISTENERS.set(el, listeners)
          }

          el.removeAttribute(attr.name)
        }

        // bind props
        if (attr.name.startsWith(':')) {
          const value = args[Number(attr.value)]
          const propName = attr.name.slice(1)
          const prop: StateSubject<any> = (node as any)._elementRef?.properties
            ?.props?.[propName]
          prop.next(value)
          el.removeAttribute(attr.name)
        }
      })

      return node
    },
    onNodeDiscarded(node) {
      const el = node as Element
      ELEMENT_LISTENERS.get(el)?.forEach(complete => complete())
      ELEMENT_LISTENERS.delete(el)
      ELEMENT_LISTENERS.delete(el)
    },
  })
}
