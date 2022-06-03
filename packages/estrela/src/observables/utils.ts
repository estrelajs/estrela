import { Observer } from './types';

const noop = () => {};

export function coerceObserver<T>(
  observer?: ((value: T) => void) | Partial<Observer<T>>
): Observer<T> {
  let {
    next = noop,
    error = noop,
    complete = noop,
  } = typeof observer === 'function' && !(observer as any).subscribe
    ? { next: observer }
    : (observer as Partial<Observer<T>>) ?? {};
  next = next.bind(observer);
  error = error.bind(observer);
  complete = complete.bind(observer);
  return { next, error, complete };
}

export function isCompletable(x: any): x is { complete(): void } {
  return x && typeof x.complete === 'function';
}

export function isNextable<T>(x: any): x is { next(value: T): void } {
  return x && typeof x.next === 'function';
}
