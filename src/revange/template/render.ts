import morphdom from '../morphdom'
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
      let value = arg instanceof StateSubject ? arg.$ : arg
      value = String(value === false ? '' : value ?? '')
      const [isAttribute, hasQuotes] = /=(\")?$/.exec(str)?.values() ?? []
      if (!isAttribute) {
        value = `<!---->${value}<!---->`
      } else if (!hasQuotes) {
        value = `"${value}"`
      }
      return str + value
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
          const arg = args[Number(attr.value)]
          const eventName = attr.name.replace('on:', '')
          const listeners = ELEMENT_LISTENERS.get(el) ?? []
          const listener = addEventListener(el, eventName, arg)
          listeners.push(listener)
          ELEMENT_LISTENERS.set(el, listeners)
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
      ELEMENT_LISTENERS.get(el)?.forEach(distach => distach())
      ELEMENT_LISTENERS.delete(el)
      ELEMENT_KEYS.delete(el)
    },
  })
}
