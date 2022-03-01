import { HTMLResult } from '../template';
import { htmlDirective } from './html-directive';

export const hAsync = (promise: Promise<any>, fallback: HTMLResult | string) =>
  htmlDirective(({ render }) => {
    render(fallback);
    promise.then(result => {
      render(result);
    });
  });
