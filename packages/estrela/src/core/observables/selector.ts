import { symbol_observable } from './symbol';
import { Observable, Observer, Subscribable } from './types';
import { createSubscriber, coerceObserver, createSubscription } from './utils';

export function createSelector<S1, Result>(
  s1: Subscribable<S1>,
  selector: (s1: S1) => Result
): Observable<Result>;
export function createSelector<S1, S2, Result>(
  s1: Subscribable<S1>,
  s2: Subscribable<S2>,
  selector: (s1: S1, s2: S2) => Result
): Observable<Result>;
export function createSelector<S1, S2, S3, Result>(
  s1: Subscribable<S1>,
  s2: Subscribable<S2>,
  s3: Subscribable<S3>,
  selector: (s1: S1, s2: S2, s3: S3) => Result
): Observable<Result>;
export function createSelector<S1, S2, S3, S4, Result>(
  s1: Subscribable<S1>,
  s2: Subscribable<S2>,
  s3: Subscribable<S3>,
  s4: Subscribable<S4>,
  selector: (s1: S1, s2: S2, s3: S3, s4: S4) => Result
): Observable<Result>;
export function createSelector<S1, S2, S3, S4, S5, Result>(
  s1: Subscribable<S1>,
  s2: Subscribable<S2>,
  s3: Subscribable<S3>,
  s4: Subscribable<S4>,
  s5: Subscribable<S5>,
  selector: (s1: S1, s2: S2, s3: S3, s4: S4, s5: S5) => Result
): Observable<Result>;
export function createSelector<S1, S2, S3, S4, S5, S6, Result>(
  s1: Subscribable<S1>,
  s2: Subscribable<S2>,
  s3: Subscribable<S3>,
  s4: Subscribable<S4>,
  s5: Subscribable<S5>,
  s6: Subscribable<S6>,
  selector: (s1: S1, s2: S2, s3: S3, s4: S4, s5: S5, s6: S6) => Result
): Observable<Result>;
export function createSelector<S1, S2, S3, S4, S5, S6, S7, Result>(
  s1: Subscribable<S1>,
  s2: Subscribable<S2>,
  s3: Subscribable<S3>,
  s4: Subscribable<S4>,
  s5: Subscribable<S5>,
  s6: Subscribable<S6>,
  s7: Subscribable<S7>,
  selector: (s1: S1, s2: S2, s3: S3, s4: S4, s5: S5, s6: S6, s7: S7) => Result
): Observable<Result>;
export function createSelector<S1, S2, S3, S4, S5, S6, S7, S8, Result>(
  s1: Subscribable<S1>,
  s2: Subscribable<S2>,
  s3: Subscribable<S3>,
  s4: Subscribable<S4>,
  s5: Subscribable<S5>,
  s6: Subscribable<S6>,
  s7: Subscribable<S7>,
  s8: Subscribable<S8>,
  selector: (
    s1: S1,
    s2: S2,
    s3: S3,
    s4: S4,
    s5: S5,
    s6: S6,
    s7: S7,
    s8: S8
  ) => Result
): Observable<Result>;
export function createSelector(
  ...args: [...states: Observable<any>[], selector: (...data: any[]) => any]
): Observable<any>;

export function createSelector(...args: any[]): Observable<any> {
  const selector = args.pop();
  const states: Observable<any>[] = args;
  const observers = new Set<Observer<any>>();
  const subscriber = createSubscriber(observers);

  const memoizedValues: Record<number, any> = {};
  let memoizedResult: any = undefined;
  let hasResult = false;

  states.forEach((state, i) => {
    state.subscribe(value => {
      if (memoizedValues[i] !== value) {
        memoizedValues[i] = value;
      }
      if (Object.keys(memoizedValues).length === states.length) {
        const values = Array.from(
          { length: states.length },
          (_, i) => memoizedValues[i]
        );
        const result = selector(...values);
        if (memoizedResult !== result) {
          memoizedResult = result;
          subscriber.next(result);
          hasResult = true;
        }
      }
    });
  });

  return {
    [symbol_observable]() {
      return this;
    },
    subscribe(observer: any) {
      const obs = coerceObserver(observer);
      observers.add(obs);
      if (hasResult) {
        obs.next(memoizedResult);
      }
      return createSubscription(subscriber);
    },
  };
}
