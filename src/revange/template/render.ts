import morphdom from 'morphdom'
import { HTMLResult } from './html-result'

interface HTMLRender {
  html: string
  args: any[]
}

const htmlRender = (result: HTMLResult, args: any[] = []): HTMLRender => {
  let html = result.template
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
  html = `<div>${html.trim()}</div>`
  return { html, args }
}

const getAllElements = (root: Element): Element[] =>
  Array.from(root.children).flatMap(element => [element, ...getAllElements(element)])

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

export function render(result: HTMLResult, element: HTMLElement) {
  const { html, args } = htmlRender(result)

  const onNodeUpdate = (node: Node | Element) => {
    const el = node as Element

    const listeners = ELEMENT_LISTENERS.get(el)
    if (listeners) {
      listeners.forEach(complete => complete())
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
        el.attributes.removeNamedItem(attr.name)
      })

    return node
  }

  // patch changes
  morphdom(element, html, {
    childrenOnly: true,
    getNodeKey(node) {
      const el = node as Element
      const attr = el.getAttribute?.('key')
      return attr ?? el.id
    },
    onElUpdated: onNodeUpdate,
    onNodeAdded: onNodeUpdate,
    onNodeDiscarded(node) {
      const el = node as Element
      const listeners = ELEMENT_LISTENERS.get(el)
      if (listeners) {
        listeners.forEach(complete => complete())
      }
    },
  })
}
