import { HTMLResult } from './HTMLResult';

export const html = (
  template: TemplateStringsArray,
  ...args: unknown[]
): HTMLResult => new HTMLResult(template, args);
