import { Subscriber } from './subscriber';
import { Subscription } from './subscription';
import { symbol_observable } from './symbol';
import { ObservableLike, Observer } from './types';
import { coerceObserver } from './utils';

export const STATE_CALLS = new Set<State<any>>();

export class State<T> extends Subscriber<T> implements ObservableLike<T> {
  get $(): T {
    STATE_CALLS.add(this);
    return this._value;
  }

  constructor(private _value: T) {
    super();
  }

  [symbol_observable]() {
    return this;
  }

  next(next: T) {
    this._value = next;
    super.next(next);
    return next;
  }

  update(updater: (value: T) => T) {
    this._value = updater(this._value);
    return this.next(this._value);
  }

  error(err: any) {
    super.error(err);
  }

  complete() {
    super.complete();
  }

  subscribe(
    observer?: ((value: T) => void) | Partial<Observer<T>>,
    options: { initialEmit?: boolean } = {}
  ) {
    const obs = coerceObserver(observer);
    this.observers.add(obs);
    if (options.initialEmit) {
      obs.next(this._value);
    }
    return new Subscription(() => this.observers.delete(obs));
  }
}

export function createState<T>(): State<T | undefined>;
export function createState<T>(initialValue: T): State<T>;
export function createState(initialValue?: any): State<any> {
  return new State(initialValue);
}
