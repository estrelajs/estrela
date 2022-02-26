import { EventEmitter } from '../observables/event_emitter'

export function addEventListener(
  emitter: EventEmitter<unknown>,
  listener: Function | EventEmitter<unknown>
): () => void
export function addEventListener(
  element: Element,
  listener: Function | EventEmitter<unknown>,
  event: string
): () => void
export function addEventListener(
  source: Element | EventEmitter<unknown>,
  listener: Function | EventEmitter<unknown>,
  event?: string
): () => void {
  const hook = (event: unknown) => {
    if (listener instanceof EventEmitter) {
      listener.emit(event)
    }
    if (typeof listener === 'function') {
      listener(event)
    }
  }
  if (source instanceof EventEmitter) {
    const subscribe = source.subscribe((event: unknown) => hook(event))
    return () => subscribe.unsubscribe()
  } else {
    source.addEventListener(event!, hook)
    return () => source.removeEventListener(event!, hook)
  }
}
