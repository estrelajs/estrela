import { effect } from '../internal/effect';
import { Subscriber } from './subscriber';
import { Subscription } from './subscription';
import { symbol_observable } from './symbol';
import { PartialObserver, Subscribable, Unsubscribable } from './types';
import { isPromiseLike, isSubscribable } from './utils';

export const STATE_CALLS: State<any>[] = [];

export class State<T> extends Subscriber<T> {
  get $(): T {
    STATE_CALLS.push(this);
    return this._value;
  }

  private _value!: T;

  private _subscription?: Unsubscribable;

  constructor(
    source: State<T> | Subscribable<T> | PromiseLike<T> | (() => T) | T
  ) {
    super();
    if (source instanceof State) {
      this._subscription = source.subscribe(this, { initialEmit: true });
    } else if (isSubscribable(source)) {
      this._subscription = source.subscribe(this);
    } else if (isPromiseLike(source)) {
      source.then(this.next.bind(this));
    } else if (typeof source === 'function') {
      this._subscription = effect(source as () => T).subscribe(this);
    } else {
      this._value = source;
    }
  }

  [symbol_observable]() {
    return this;
  }

  complete(): void {
    this._subscription?.unsubscribe();
    super.complete();
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

  subscribe(
    observer?: PartialObserver<T>,
    options: { initialEmit?: boolean } = {}
  ) {
    this.add(observer);
    if (options.initialEmit) {
      typeof observer === 'function'
        ? observer(this._value)
        : observer?.next?.(this._value);
    }
    return new Subscription(() => this.remove(observer));
  }
}

export function createState<T>(): State<T | undefined>;
export function createState<T>(initialValue: T | (() => T)): State<T>;
export function createState<T>(
  source: State<T> | Subscribable<T> | PromiseLike<T>
): State<T | undefined>;
export function createState(initialValue?: any): State<any> {
  return new State(initialValue);
}
