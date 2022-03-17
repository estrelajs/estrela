import { catchError, from, map, Observable, of } from 'rxjs';
import { useEffect, useState } from '../core/hooks';

export function asyncMap<T, R>(
  deferredArray: Promise<T[]> | Observable<T[]>,
  callback: (item: T, index: number, array: T[]) => R
): R[] | undefined;
export function asyncMap<T, R>(
  deferredArray: Promise<T[]> | Observable<T[]>,
  callback: (item: T, index: number, array: T[]) => R,
  onWaiting: R[],
  onError?: R[]
): R[];
export function asyncMap<T, R>(
  deferredArray: Promise<T[]> | Observable<T[]>,
  callback: (item: T, index: number, array: T[]) => R,
  onWaiting?: R[],
  onError?: R[]
): R[] | undefined {
  const [result, setResult] = useState(onWaiting);

  useEffect(() => {
    const subscription = from(deferredArray)
      .pipe(
        map(data => data.map(callback)),
        catchError(() => of(onError))
      )
      .subscribe(setResult);
    return () => subscription.unsubscribe();
  }, [deferredArray]);

  return result;
}
