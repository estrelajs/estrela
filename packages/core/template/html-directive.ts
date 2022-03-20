import { HTMLTemplate } from './html-template';

export const html = (template: TemplateStringsArray, ...args: any[]): HTMLTemplate =>
  new HTMLTemplate(template, args);
