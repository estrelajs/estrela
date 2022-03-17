import { catchError, from, Observable, of } from 'rxjs';
import { DirectiveCallback, HTMLTemplate } from '../types';
export function async<T>(
  deferred: Promise<T> | Observable<T>
): DirectiveCallback<T | undefined>;
export function async<T>(
  deferred: Promise<T> | Observable<T>,
  onWaiting: T,
  onError?: T
): DirectiveCallback<T>;
export function async<T>(
  deferred: Promise<T> | Observable<T>,
  onWaiting?: T,
  onError?: T
): DirectiveCallback<T | undefined> {
  let render: Function;
  return {
    directive: 'async',
    render: ({ requestRender, useEffect, useState }) => {
      const [result, setResult] = useState(onWaiting);
      render = requestRender;

      useEffect(() => {
        const subscription = from(deferred)
          .pipe(catchError(() => of(onError)))
          .subscribe((content: any) => {
            setResult(content);
            render();
          });
        return () => subscription.unsubscribe();
      }, [deferred]);

      return result;
    },
  };
}
