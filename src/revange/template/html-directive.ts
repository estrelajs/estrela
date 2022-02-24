import { HTMLResult } from './html-result'

export const html = (template: TemplateStringsArray, ...args: unknown[]) =>
  new HTMLResult(template, args)
