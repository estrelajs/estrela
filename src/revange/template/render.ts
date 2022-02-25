import morphdom from '../morphdom'
import { HTMLResult } from './html-result'

interface HTMLRender {
  html: string
  args: any[]
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
      let data = String(arg ?? '')
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

const addEventListener = (element: Element, type: string, listener: Function) => {
  const hook = (event: Event) => {
    // if (listener instanceof Emitter) {
    //   listener.emit(event)
    // }
    if (typeof listener === 'function') {
      listener(event)
    }
  }
  element.addEventListener(type, hook)
  return () => element.removeEventListener(type, hook)
}

const ELEMENT_LISTENERS = new Map<Element, (() => void)[]>()
const ELEMENT_KEYS = new Map<Element, string>()

export function render(result: HTMLResult, element: HTMLElement) {
  const { html, args } = htmlRender(result)

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

      if (key) {
        ELEMENT_KEYS.set(el, key)
        el.removeAttribute('key')
      }

      // bing event listeners
      Array.from(el.attributes ?? [])
        .filter(attr => attr.name.startsWith('on:'))
        .forEach(attr => {
          const argIndex = Number(attr.value)
          const listener = addEventListener(
            el,
            attr.name.replace('on:', ''),
            args[argIndex]
          )
          const listeners = ELEMENT_LISTENERS.get(el) ?? []
          listeners.push(listener)
          ELEMENT_LISTENERS.set(el, listeners)
          el.removeAttribute(attr.name)
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
