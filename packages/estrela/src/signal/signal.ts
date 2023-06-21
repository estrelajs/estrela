import { trackSignal, triggerEffectsForSignal } from './effect';
import { EqualityFn, ReadonlySignal, Signal } from './types';
import { FunctionExt } from './utils';

interface _Signal<T> {
  (): T;
}
class _Signal<T> extends FunctionExt {
  protected equal?: EqualityFn<T>;
  protected value!: T;

  constructor(initialValue: T, equal?: false | EqualityFn<T>) {
    super(() => {
      trackSignal(this);
      return this.value;
    });

    if (equal === false) {
      this.equal = () => false;
    } else if (equal) {
      this.equal = equal;
    }

    this.value = initialValue;
  }

  asReadonly(): ReadonlySignal<T> {
    return () => this();
  }

  /** Mutate the value without reassigning it. */
  mutate(fn: (value: T) => void): void {
    fn(this.value);
    triggerEffectsForSignal(this);
  }

  /** Sets new value. */
  set(newValue: T): void {
    const equal = this.equal ?? ((a, b) => a === b);
    if (equal(this.value, newValue)) return;
    this.value = newValue;
    this.mutate(() => {});
  }

  /** Updates the value based on the current value. */
  update(fn: (value: T) => T): void {
    this.set(fn(this.value));
  }
}

/**
 * Creates a new signal with an initial value and optional equality function.
 * A signal is a function that returns the current value and can notify effects.
 * @param initialValue The initial value of the signal.
 * @param equal An optional function used to compare the current and new values to determine if an update should be triggered.
 * @returns A signal function with additional methods for setting the value.
 **/
export function signal<T>(
  initialValue: T,
  equal?: false | EqualityFn<T>
): Signal<T> {
  return new _Signal(initialValue, equal);
}

export function isSignal<T = unknown>(value: unknown): value is Signal<T> {
  return value instanceof _Signal;
}
