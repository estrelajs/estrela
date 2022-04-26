import { createSelector } from './selector';

declare global {
  interface SymbolConstructor {
    readonly observable: symbol;
  }
}

export interface Completable {
  complete: () => void;
}

export interface Subscribable<T> {
  subscribe(
    observer?: ((value: T) => void) | Partial<Observer<T>>
  ): Subscription;
}

export interface Observable<T> extends Subscribable<T> {
  [Symbol.observable](): Observable<T>;

  subscribe(
    observer?: ((value: T) => void) | Partial<Observer<T>>
  ): Subscription;
}

export interface EventEmitter<T> extends Observable<T>, Completable {
  /** Return true when emitter is being observed. */
  get observed(): boolean;

  /** Emit event with the given value. */
  next(value: T): void;
}

export type SelectorLike<T> = Observable<T> | Parameters<typeof createSelector>;

export interface State<T> extends Observable<T>, Completable {
  /** Get the current state value. */
  (): T;

  asObserver(): Observer<T>;

  /**
   * Update the current state.
   * @param value next value.
   */
  next(value: T): void;

  /**
   * Update the current state based on the last value.
   * @param updater callback function to update current state.
   */
  update(updater: (value: T) => T): void;
}

export interface Store<S extends Object> extends Observable<S> {
  /** Get the current state. */
  getState(): Readonly<S>;

  /**
   * Update the state with the updater callback.
   * @param updater callback function to update current state.
   */
  update(updater: (state: Readonly<S>) => S): void;
}

export interface Observer<T> extends Completable {
  next: (value: T) => void;
  error: (err: any) => void;
  complete: () => void;
}

export interface Subscriber<T> extends Observer<T> {
  completed: boolean;
  hasError: boolean;
  thrownError?: any;
}

export interface Unsubscribable {
  unsubscribe(): void;
}

export interface Subscription extends Unsubscribable {
  add(subscription: Unsubscribable): void;
}
