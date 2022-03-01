import { HTMLResult } from './html-result';

export const html = (
  template: TemplateStringsArray,
  ...args: unknown[]
): HTMLResult => new HTMLResult(template, args);
