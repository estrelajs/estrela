import { catchError, from, Observable, of } from 'rxjs';
import { directive } from './directive';

/**
 * Subscribe to a deferred context and return the current value.
 *
 * @param deferred promise or observable value.
 * @returns the current state of the promise.
 */
export function async<T>(deferred: Promise<T> | Observable<T>): T | undefined;

/**
 * Subscribe to a deferred context and return the current value.
 *
 * @param deferred promise or observable value.
 * @param onWaiting fallback value while promise is resolving.
 * @param onError fallback value when it throws an error.
 * @returns the current state of the promise.
 */
export function async<T>(
  deferred: Promise<T> | Observable<T>,
  onWaiting: T,
  onError?: T
): T;

export function async<T>(
  deferred: Promise<T> | Observable<T>,
  onWaiting?: T,
  onError?: T
) {
  return directive<T | undefined>(
    'async',
    setResult => {
      setResult(onWaiting);
      const subscription = from(deferred)
        .pipe(catchError(() => of(onError)))
        .subscribe(setResult);
      return () => subscription.unsubscribe();
    },
    [deferred]
  );
}
