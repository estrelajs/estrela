import { PartialObserver, Subject, Subscription } from 'rxjs'

export interface EventEmitter<T> extends Omit<Subject<T>, 'next'> {
  /**
   * Creates an instance of this class that can
   * deliver events synchronously or asynchronously.
   * @param isAsync When true, deliver events asynchronously.
   */
  new (isAsync?: boolean): EventEmitter<T>

  /**
   * Emits an event containing a given value.
   * @param value The value to emit.
   */
  emit(value?: T): void

  /**
   * Registers handlers for events emitted by this instance.
   * @param next When supplied, a custom handler for emitted events.
   * @param error When supplied, a custom handler for an error notification from this emitter.
   * @param complete When supplied, a custom handler for a completion notification from this
   *     emitter.
   */
  subscribe(
    next?: (value: T) => void,
    error?: (error: any) => void,
    complete?: () => void
  ): Subscription
  /**
   * Registers handlers for events emitted by this instance.
   * @param observerOrNext When supplied, a custom handler for emitted events, or an observer
   *     object.
   * @param error When supplied, a custom handler for an error notification from this emitter.
   * @param complete When supplied, a custom handler for a completion notification from this
   *     emitter.
   */
  subscribe(observerOrNext?: any, error?: any, complete?: any): Subscription
}

class EventEmitter_ extends Subject<any> {
  protected readonly __isAsync: boolean

  constructor(isAsync = false) {
    super()
    this.__isAsync = isAsync
  }

  emit(value?: any) {
    super.next(value)
  }

  override subscribe(
    observerOrNext?: any,
    error?: any,
    complete?: any
  ): Subscription {
    let nextFn = observerOrNext
    let errorFn = error || (() => null)
    let completeFn = complete

    if (observerOrNext && typeof observerOrNext === 'object') {
      const observer = observerOrNext as PartialObserver<unknown>
      nextFn = observer.next?.bind(observer)
      errorFn = observer.error?.bind(observer)
      completeFn = observer.complete?.bind(observer)
    }

    if (this.__isAsync) {
      errorFn = _wrapInTimeout(errorFn)

      if (nextFn) {
        nextFn = _wrapInTimeout(nextFn)
      }

      if (completeFn) {
        completeFn = _wrapInTimeout(completeFn)
      }
    }

    const sink = super.subscribe({
      next: nextFn,
      error: errorFn,
      complete: completeFn,
    })

    if (observerOrNext instanceof Subscription) {
      observerOrNext.add(sink)
    }

    return sink
  }
}

function _wrapInTimeout(fn: (value: unknown) => any) {
  return (value: unknown) => {
    setTimeout(fn, undefined, value)
  }
}

export const EventEmitter: {
  new (isAsync?: boolean): EventEmitter<any>
  new <T>(isAsync?: boolean): EventEmitter<T>
  readonly prototype: EventEmitter<any>
} = EventEmitter_ as any
