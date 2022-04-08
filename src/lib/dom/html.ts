import { HTMLTemplate } from '../core';

export const html = (
  template: TemplateStringsArray,
  ...args: unknown[]
): HTMLTemplate => new HTMLTemplate(template, args);
