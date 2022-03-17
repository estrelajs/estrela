import { catchError, from, map, Observable, of } from 'rxjs';
import { DirectiveCallback, HTMLTemplate } from '../types';

export function asyncMap<T, R>(
  deferredArray: Promise<T[]> | Observable<T[]>,
  callback: (item: T, index: number, array: T[]) => R
): DirectiveCallback<R[] | undefined>;
export function asyncMap<T, R>(
  deferredArray: Promise<T[]> | Observable<T[]>,
  callback: (item: T, index: number, array: T[]) => R,
  onWaiting: R[],
  onError?: R[]
): DirectiveCallback<R[]>;
export function asyncMap<T, R>(
  deferredArray: Promise<T[]> | Observable<T[]>,
  callback: (item: T, index: number, array: T[]) => R,
  onWaiting?: R[],
  onError?: R[]
): DirectiveCallback<R[] | undefined> {
  let render: Function;

  return {
    directive: 'asyncMap',
    render: ({ requestRender, useEffect, useState }) => {
      const [result, setResult] = useState(onWaiting);
      render = requestRender;

      useEffect(() => {
        const subscription = from(deferredArray)
          .pipe(
            map(data => data.map(callback)),
            catchError(() => of(onError))
          )
          .subscribe((content: any) => {
            setResult(content);
            render();
          });
        return () => subscription.unsubscribe();
      }, [deferredArray]);

      return result;
    },
  };
}
