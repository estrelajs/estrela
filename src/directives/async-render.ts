import { catchError, isObservable, Observable, of } from 'rxjs';
import { DirectiveCallback } from '../types';

export function asyncRender<T>(
  defered: Promise<T> | Observable<T>,
  until?: T,
  onerror?: T
): DirectiveCallback<T> {
  return (renderContent, { useEffect, useState }) => {
    const [result, setResult] = useState(until);
    const next = (content: T | undefined) => {
      setResult(content);
      renderContent(content);
    };

    // render content in state
    next(result);

    useEffect(() => {
      // Observable like
      if (isObservable(defered)) {
        const subscription = defered
          .pipe(catchError(() => of(onerror)))
          .subscribe(next);
        return () => subscription.unsubscribe();
      }

      // Promise like
      let canceled = false;
      defered
        .catch(() => onerror)
        .then(content => {
          if (!canceled) {
            next(content);
          }
        });
      return () => (canceled = true);
    }, [defered]);
  };
}
