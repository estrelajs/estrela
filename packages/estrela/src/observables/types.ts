import { Subscription } from './subscription';

/** Followed RxJs pattern. */

declare global {
  interface SymbolConstructor {
    readonly observable: symbol;
  }
}

// SUBSCRIPTION INTERFACES

export interface Unsubscribable {
  unsubscribe(): void;
}

export type TeardownLogic = Subscription | Unsubscribable | (() => void);

export interface SubscriptionLike extends Unsubscribable {
  unsubscribe(): void;
  readonly closed: boolean;
}

// OBSERVABLE INTERFACES

export interface Subscribable<T> {
  subscribe(observer?: Partial<Observer<T>>): Unsubscribable;
}

/**
 * An object that implements the `Symbol.observable` interface.
 */
export interface ObservableLike<T> extends Subscribable<T> {
  [Symbol.observable]: () => Subscribable<T>;
  subscribe(
    observer?: ((value: T) => void) | Partial<Observer<T>>,
    options?: { initialEmit?: boolean }
  ): Subscription;
}

// OBSERVER INTERFACES

export interface Observer<T> {
  next: (value: T) => void;
  error: (err: any) => void;
  complete: () => void;
}

export interface SubjectObserver<T> {
  readonly closed: boolean;
  readonly observed: boolean;
  next: (value: T) => void;
  error: (err: any) => void;
  complete: () => void;
}
