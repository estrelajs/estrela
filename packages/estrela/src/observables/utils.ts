import { Subscribable } from './types';

export function isCompletable(x: any): x is { complete(): void } {
  return x && typeof x.complete === 'function';
}

export function isNextable<T>(x: any): x is { next(value: T): void } {
  return x && typeof x.next === 'function';
}

export function isSubscribable<T>(x: any): x is Subscribable<T> {
  return x && typeof x.subscribe === 'function';
}
