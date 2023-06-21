import { effect, trackSignal, triggerEffectsForSignal } from './effect';
import { EqualityFn, ReadonlySignal } from './types';

/**
 * Creates a computed signal that derives its value from other signals.
 * The computed signal is updated automatically whenever its dependencies change.
 * @param fn The function that computes the value based on other signals.
 * @param equal An optional function used to compare the current and new values to determine if an update should be triggered.
 * @returns A readonly signal representing the computed value.
 */
export function computed<T>(
  fn: () => T,
  equal?: false | EqualityFn<T>
): ReadonlySignal<T> {
  let value: T;
  let equalFn = (a: T, b: T) => a === b;

  if (equal === false) {
    equalFn = () => false;
  } else if (equal) {
    equalFn = equal;
  }

  const signal = () => {
    trackSignal(signal);
    return value;
  };

  effect(() => {
    const nextValue = fn();
    if (equalFn(value, nextValue)) return;
    value = nextValue;
    triggerEffectsForSignal(signal);
  });

  return signal;
}
