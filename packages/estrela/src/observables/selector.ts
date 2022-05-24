import { Observable } from './observable';
import { STATE_CALLS } from './state';
import { createSubscriber } from './subscriber';
import { createSubscription } from './subscription';
import { symbol_observable } from './symbol';
import { Observer, Subscribable } from './types';
import { coerceObservable, coerceObserver } from './utils';

export type Selectable<T> = Promise<T> | Subscribable<T>;

/**
 * Create a new observable by combining the given observables
 * and applying to the selector function.
 */
export function createSelector<Result>(
  selector: () => Result
): Observable<Result>;
export function createSelector<S1, Result>(
  s1: Selectable<S1>,
  selector: (s1: S1) => Result
): Observable<Result>;
export function createSelector<S1, S2, Result>(
  s1: Selectable<S1>,
  s2: Selectable<S2>,
  selector: (s1: S1, s2: S2) => Result
): Observable<Result>;
export function createSelector<S1, S2, S3, Result>(
  s1: Selectable<S1>,
  s2: Selectable<S2>,
  s3: Selectable<S3>,
  selector: (s1: S1, s2: S2, s3: S3) => Result
): Observable<Result>;
export function createSelector<S1, S2, S3, S4, Result>(
  s1: Selectable<S1>,
  s2: Selectable<S2>,
  s3: Selectable<S3>,
  s4: Selectable<S4>,
  selector: (s1: S1, s2: S2, s3: S3, s4: S4) => Result
): Observable<Result>;
export function createSelector<S1, S2, S3, S4, S5, Result>(
  s1: Selectable<S1>,
  s2: Selectable<S2>,
  s3: Selectable<S3>,
  s4: Selectable<S4>,
  s5: Selectable<S5>,
  selector: (s1: S1, s2: S2, s3: S3, s4: S4, s5: S5) => Result
): Observable<Result>;
export function createSelector<S1, S2, S3, S4, S5, S6, Result>(
  s1: Selectable<S1>,
  s2: Selectable<S2>,
  s3: Selectable<S3>,
  s4: Selectable<S4>,
  s5: Selectable<S5>,
  s6: Selectable<S6>,
  selector: (s1: S1, s2: S2, s3: S3, s4: S4, s5: S5, s6: S6) => Result
): Observable<Result>;
export function createSelector<S1, S2, S3, S4, S5, S6, S7, Result>(
  s1: Selectable<S1>,
  s2: Selectable<S2>,
  s3: Selectable<S3>,
  s4: Selectable<S4>,
  s5: Selectable<S5>,
  s6: Selectable<S6>,
  s7: Selectable<S7>,
  selector: (s1: S1, s2: S2, s3: S3, s4: S4, s5: S5, s6: S6, s7: S7) => Result
): Observable<Result>;
export function createSelector<S1, S2, S3, S4, S5, S6, S7, S8, Result>(
  s1: Selectable<S1>,
  s2: Selectable<S2>,
  s3: Selectable<S3>,
  s4: Selectable<S4>,
  s5: Selectable<S5>,
  s6: Selectable<S6>,
  s7: Selectable<S7>,
  s8: Selectable<S8>,
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
  const states = args.map(coerceObservable);
  const observers = new Set<Observer<any>>();
  const subscriber = createSubscriber(observers);
  const length = states.length;

  let memoizedValues: Record<number, any> = {};
  let memoizedResult: any = undefined;
  let hasInitialized = false;
  let hasResult = false;

  const subscribeAt = (index: number, initialEmit?: boolean) => {
    states[index].subscribe(
      value => {
        memoizedValues[index] = value;
        if (Object.keys(memoizedValues).length >= length) {
          execute();
        }
      },
      { initialEmit }
    );
  };

  const execute = () => {
    STATE_CALLS.clear();
    hasResult = true;
    const result = selector(
      ...Array.from({ length }, (_, i) => memoizedValues[i])
    );

    STATE_CALLS.forEach(state => {
      if (!states.includes(state)) {
        subscribeAt(states.push(state) - 1);
      }
    });

    if (memoizedResult !== result) {
      memoizedResult = result;
      subscriber.next(result);
    }

    STATE_CALLS.clear();
  };

  const initialize = () => {
    if (!hasInitialized) {
      hasInitialized = true;
      states.forEach((_, i) => subscribeAt(i, true));
      if (states.length === 0) {
        execute();
      }
    }
  };

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
      initialize();
      return createSubscription(() => observers.delete(obs));
    },
  };
}