import { catchError, from, Observable, of } from 'rxjs';
import { DirectiveCallback, HTMLTemplate } from '../types';

export function asyncRender<T extends HTMLTemplate>(
  deferred: Promise<T | T[]> | Observable<T | T[]>,
  onWaiting?: T,
  onError?: T
): DirectiveCallback {
  return (renderContent, { useEffect, useState }) => {
    const [result, setResult] = useState(onWaiting);
    const next = (content: any) => {
      setResult(content);
      renderContent(content);
    };

    useEffect(() => {
      const subscription = from(deferred)
        .pipe(catchError(() => of(onError)))
        .subscribe(next);
      return () => subscription.unsubscribe();
    }, [deferred]);

    // render content in state
    renderContent(result);
  };
}
