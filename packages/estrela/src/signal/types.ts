export type Cleanup = () => void;

export type Effect = (iteration: number) => void | Cleanup;

export type EqualityFn<T> = (prev: T, next: T) => boolean;

export interface ReadonlySignal<T> {
  /** Gets the current value. */
  (): T;
}

export interface Signal<T> extends ReadonlySignal<T> {
  /** Returns a readonly signal function. */
  asReadonly(): ReadonlySignal<T>;

  /** Mutate the value without reassigning it. */
  mutate(fn: (value: T) => void): void;

  /** Sets new value. */
  set(newValue: T): void;

  /** Updates the value based on the current value. */
  update(fn: (value: T) => T): void;
}
