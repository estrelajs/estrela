import { catchError, from, map, Observable, of } from 'rxjs';
import { DirectiveCallback, HTMLTemplate } from '../types';

export function asyncMap<T>(
  deferredArray: Promise<T[]> | Observable<T[]>,
  callback: (item: T, index: number, array: T[]) => HTMLTemplate,
  onWaiting?: HTMLTemplate,
  onError?: HTMLTemplate
): DirectiveCallback {
  return (renderContent, { useEffect, useState }) => {
    const [result, setResult] = useState(onWaiting);
    const next = (content: any) => {
      setResult(content);
      renderContent(content);
    };

    useEffect(() => {
      const subscription = from(deferredArray)
        .pipe(
          map(data => data.map(callback)),
          catchError(() => of(onError))
        )
        .subscribe(next);
      return () => subscription.unsubscribe();
    }, [deferredArray]);

    // render content in state
    renderContent(result);
  };
}
