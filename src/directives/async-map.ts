import { catchError, from, map, Observable, of } from 'rxjs';
import { DirectiveCallback, HTMLTemplate } from '../types';

export function asyncMap<T>(
  deferredArray: Promise<T[]> | Observable<T[]>,
  callback: (item: T, index: number, array: T[]) => HTMLTemplate,
  onWaiting?: HTMLTemplate,
  onError?: HTMLTemplate
): DirectiveCallback {
  return (requestRender, { useEffect, useState }) => {
    const [result, setResult] = useState(onWaiting);

    useEffect(() => {
      const subscription = from(deferredArray)
        .pipe(
          map(data => data.map(callback)),
          catchError(() => of(onError))
        )
        .subscribe((content: any) => {
          setResult(content);
          requestRender();
        });
      return () => subscription.unsubscribe();
    }, [deferredArray]);

    return result;
  };
}
