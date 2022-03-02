import { isObservable, Observable } from 'rxjs';
import { HTMLTemplate } from '../types';
import { htmlDirective } from './html-directive';

export function asyncRender(
  defered: Observable<HTMLTemplate>
): (virtualEl: HTMLDivElement) => void;
export function asyncRender(
  defered: Promise<HTMLTemplate>,
  until?: HTMLTemplate,
  onerror?: HTMLTemplate
): (virtualEl: HTMLDivElement) => void;
export function asyncRender(
  defered: Promise<HTMLTemplate> | Observable<HTMLTemplate>,
  until?: HTMLTemplate,
  onerror?: HTMLTemplate
): (virtualEl: HTMLDivElement) => void {
  return htmlDirective(render => {
    if (isObservable(defered)) {
      defered.subscribe(result => render(result));
    } else {
      if (until) {
        render(until);
      }
      defered
        .then(result => render(result))
        .catch(() => {
          if (onerror) {
            render(onerror);
          }
        });
    }
  });
}
