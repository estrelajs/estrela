import { ObjectUnsubscribedError, Subject } from 'rxjs'

export interface StateSubject<T> extends Subject<T> {
  /** Current state value. */
  (): T

  /**
   * Updates the current state.
   * @param value next value.
   */
  next(value: T): void

  /**
   * Updates the current state based on the last value.
   * @param updater callback function to update current state.
   */
  update(updater: (value: T) => T): void
}

class StateSubject_ extends Subject<any> {
  constructor(private _value: any) {
    super()

    const _this: any = function () {
      const { hasError, thrownError, _value } = _this
      if (hasError) {
        throw thrownError
      }
      _this._throwIfClosed()
      return _value
    }

    const proto = Object.getPrototypeOf(this)
    Object.assign(proto, {
      apply: _this.apply,
      bind: _this.bind,
      call: _this.call,
      toString: _this.toString,
    })
    Object.setPrototypeOf(_this, proto)
    Object.assign(_this, this)

    return _this
  }

  next(value: any): void {
    this._value = value
    super.next(this._value)
  }

  update(updater: (value: any) => any): void {
    this._value = updater(this._value)
    super.next(this._value)
  }

  /** @internal */
  protected _throwIfClosed() {
    if (this.closed) {
      throw new ObjectUnsubscribedError()
    }
  }
}

export const StateSubject: {
  new <T>(value: T): StateSubject<T>
  readonly prototype: StateSubject<any>
} = StateSubject_ as any
