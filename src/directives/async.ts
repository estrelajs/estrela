import { catchError, from, Observable, of } from 'rxjs';
import { useEffect, useState } from '../core/hooks';

export function async<T>(deferred: Promise<T> | Observable<T>): T | undefined;
export function async<T>(
  deferred: Promise<T> | Observable<T>,
  onWaiting: T,
  onError?: T
): T;
export function async<T>(
  deferred: Promise<T> | Observable<T>,
  onWaiting?: T,
  onError?: T
): T | undefined {
  const [result, setResult] = useState(onWaiting);

  useEffect(() => {
    const subscription = from(deferred)
      .pipe(catchError(() => of(onError)))
      .subscribe(setResult);
    return () => subscription.unsubscribe();
  }, [deferred]);

  return result;
}
