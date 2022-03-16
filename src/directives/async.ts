import { catchError, from, Observable, of } from 'rxjs';
import { DirectiveCallback, HTMLTemplate } from '../types';

export function async<T extends HTMLTemplate>(
  deferred: Promise<T> | Observable<T>,
  onWaiting?: T,
  onError?: T
): DirectiveCallback {
  return (requestRender, { useEffect, useState }) => {
    const [result, setResult] = useState(onWaiting);

    useEffect(() => {
      const subscription = from(deferred)
        .pipe(catchError(() => of(onError)))
        .subscribe((content: any) => {
          setResult(content);
          requestRender();
        });
      return () => subscription.unsubscribe();
    }, [deferred]);

    return result;
  };
}
