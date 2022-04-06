import { Observable } from './observable';
import { Observer, Subscriber } from './types';
import { isObservableState } from './utils';

export const symbol_observable: typeof Symbol.observable = (() =>
  (typeof Symbol === 'function' && Symbol.observable) ||
  '@@observable')() as any;

export function createObservable<T>(
  subscriber: Subscriber<T>,
  observers: Set<Observer<T>>
): Observable<T> {
  return {
    get completed() {
      return subscriber.completed;
    },
    get hasError() {
      return subscriber.hasError;
    },
    get observed() {
      return observers.size > 0;
    },
    subscribe(observer) {
      const {
        next = () => {},
        error = () => {},
        complete = () => {},
      } = typeof observer === 'function' && !isObservableState(observer)
        ? { next: observer }
        : (observer as Partial<Observer<T>>) ?? {};
      const obs = { next, error, complete };
      observers.add(obs);
      return {
        unsubscribe() {
          observers.delete(obs);
        },
      };
    },
    [symbol_observable]() {
      return this;
    },
  };
}

export function createSubscriber<T>(
  observers: Set<Observer<T>>
): Subscriber<T> {
  return {
    completed: false,
    hasError: false,
    next(value: T) {
      if (!this.completed && !this.hasError) {
        observers.forEach(observer => observer.next(value));
      }
    },
    error(err: any) {
      if (!this.completed && !this.hasError) {
        observers.forEach(observer => observer.error(err));
        this.hasError = true;
        this.thrownError = err;
      }
    },
    complete() {
      if (!this.completed && !this.hasError) {
        observers.forEach(observer => observer.complete());
        this.completed = true;
      }
    },
  };
}
