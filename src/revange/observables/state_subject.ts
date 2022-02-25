import { BehaviorSubject } from 'rxjs'

export interface StateSubject<T>
  extends Omit<BehaviorSubject<T>, 'value' | 'getValue'> {
  /** Current state value. */
  get $(): T

  /**
   * Updates the current state based on the last value.
   * @param updater callback function to update current state.
   */
  update(updater: (value: T) => T): void
}

class StateSubject_ extends BehaviorSubject<any> {
  get $() {
    return this.getValue()
  }

  update(updater: (value: any) => any): void {
    const value = updater(this.getValue())
    this.next(value)
  }
}

export const StateSubject: {
  new <T>(value: T): StateSubject<T>
  readonly prototype: StateSubject<any>
} = StateSubject_ as any
