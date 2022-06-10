import { Observable } from './observable';
import { STATE_CALLS } from './state';
import { Observer, Subscribable } from './types';

export class Selector<T> extends Observable<T> {
  private readonly length: number;
  private readonly observers = new Set<Observer<T>>();
  private readonly selector: (...args: any[]) => T;
  private readonly states: Subscribable<T>[];
  private hasInitialized = false;
  private hasResult = false;
  private memoizedResult: any = undefined;
  private memoizedValues: Record<number, any> = {};

  constructor(args: any[]) {
    super();
    const clone = [...args];
    this.cb = this.subscriber.bind(this);
    this.selector = clone.pop();
    this.states = clone;
    this.length = clone.length;
  }

  private execute(): void {
    STATE_CALLS.clear();
    this.hasResult = true;
    const result = this.selector(
      ...Array.from({ length: this.length }, (_, i) => this.memoizedValues[i])
    );

    STATE_CALLS.forEach(state => {
      if (!this.states.includes(state)) {
        this.subscribeAt(this.states.push(state) - 1);
      }
    });

    if (this.memoizedResult !== result) {
      this.memoizedResult = result;
      this.observers.forEach(observer => observer.next(result));
    }

    STATE_CALLS.clear();
  }

  private subscriber(observer: Observer<T>): () => void {
    this.observers.add(observer);

    if (!this.hasInitialized) {
      this.hasInitialized = true;
      this.states.forEach((_, i) => this.subscribeAt(i, true));
      if (this.states.length === 0) {
        this.execute();
      }
    }

    if (this.hasResult && this.states.length > 0) {
      observer.next(this.memoizedResult);
    }

    return () => this.observers.delete(observer);
  }

  private subscribeAt(index: number, initialEmit?: boolean): void {
    this.states[index].subscribe(
      value => {
        this.memoizedValues[index] = value;
        if (Object.keys(this.memoizedValues).length >= length) {
          this.execute();
        }
      },
      { initialEmit }
    );
  }
}

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
export function createSelector(...args: any[]): Selector<any> {
  return new Selector(args);
}
