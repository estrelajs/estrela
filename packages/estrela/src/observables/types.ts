import { Subscription } from './subscription';

declare global {
  interface SymbolConstructor {
    readonly observable: symbol;
  }
}

export interface Observer<T> {
  next: (value: T) => void;
  error: (err: any) => void;
  complete: () => void;
}

export type PartialObserver<T> = ((value: T) => void) | Partial<Observer<T>>;

export interface Subscribable<T> {
  subscribe(observer?: PartialObserver<T>, options?: any): Unsubscribable;
}

export interface SubscriberLike<T> extends Observer<T> {
  readonly closed: boolean;
  readonly observed: boolean;
}

export type TeardownLogic = (() => void) | Unsubscribable | Subscription;

export interface Unsubscribable {
  unsubscribe(): void;
}
