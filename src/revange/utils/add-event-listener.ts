import { EventEmitter } from '../observables/event_emitter'

export function addEventListener(
  element: Element,
  event: string,
  listener: Function | EventEmitter<unknown>
): () => void {
  const hook = (event: unknown) => {
    const data = event instanceof CustomEvent ? event.detail : event
    if (listener instanceof EventEmitter) {
      listener.emit(data)
    }
    if (typeof listener === 'function') {
      listener(data)
    }
  }
  element.addEventListener(event, hook)
  return () => element.removeEventListener(event, hook)
}
