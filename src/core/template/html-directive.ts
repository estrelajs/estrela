import { HTMLResult } from './HTMLResult';

export const html = (template: TemplateStringsArray, ...args: any[]): HTMLResult =>
  new HTMLResult(template, args);
