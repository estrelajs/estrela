import { HTMLResult } from './html-result'

interface HTMLRender {
  html: string
  args: any[]
}

const hashes = new Map<string, number>()

const generateHash = (str: string) => {
  var hash = 0,
    i,
    chr
  if (str.length === 0) return hash
  for (i = 0; i < str.length; i++) {
    chr = str.charCodeAt(i)
    hash = (hash << 5) - hash + chr
    hash |= 0 // Convert to 32bit integer
  }
  return hash
}

const htmlRender = (result: HTMLResult, args: any[] = []): HTMLRender => {
  const html = result.template
    .map((str, i) => {
      const arg = result.args[i]
      if (i >= result.args.length) {
        return str
      }
      if (/((on)?:\w+|ref)=\"?$/.test(str)) {
        const index = args.push(arg) - 1
        return str + index
      }
      if (arg instanceof HTMLResult || Array.isArray(arg)) {
        const results = Array.isArray(arg) ? arg : [arg]
        return str + results.map(_arg => htmlRender(_arg, args).html).join('')
      }
      let hashcode = hashes.get(str)
      if (!hashcode) {
        hashcode = generateHash(str)
        hashes.set(str, hashcode)
      }
      return str + `<!--${hashcode}-->` + (arg ?? '')
    })
    .join('')
    .trim()
  return { html, args }
}

const getAllElements = (root: Element): Element[] =>
  Array.from(root.children).flatMap(element => [element, ...getAllElements(element)])

const addEventListener = (element: Element, type: string, listener: any) => {
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

export function render(result: HTMLResult, element: HTMLElement) {
  const { html, args } = htmlRender(result)
  element.innerHTML = html

  const elements = getAllElements(element)

  elements.forEach(elem => {
    // bing event listeners
    Array.from(elem.attributes)
      .filter(attr => attr.name.startsWith('on:'))
      .forEach(attr => {
        const argIndex = Number(attr.value)
        const listener = addEventListener(
          elem,
          attr.name.replace('on:', ''),
          args[argIndex]
        )
        // _listeners.push(listener)
        elem.attributes.removeNamedItem(attr.name)
      })
  })
}
