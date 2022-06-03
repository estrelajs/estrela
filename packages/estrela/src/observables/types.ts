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

export type TeardownLogic = (() => void) | Unsubscribable | Subscription;

export interface SubscriptionLike extends Unsubscribable {
  readonly closed: boolean;
  unsubscribe(): void;
}

// OBSERVABLE INTERFACES

export interface Subscribable<T> {
  subscribe(observer?: Partial<Observer<T>>): Unsubscribable;
}

/**
 * An object that implements the `Symbol.observable` interface.
 [Symbol.observable]: () => Subscribable<T>;
 */
export interface ObservableLike<T> extends Subscribable<T> {
  subscribe(
    observer?: ((value: T) => void) | Partial<Observer<T>>
  ): Subscription;
}

// OBSERVER INTERFACES

export interface Observer<T> {
  next: (value: T) => void;
  error: (err: any) => void;
  complete: () => void;
}

export interface SubscriberLike<T> extends Observer<T> {
  readonly closed: boolean;
  readonly observed: boolean;
}
