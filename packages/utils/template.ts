import { HTMLTemplate } from '../core';

/** Type check for HTMLTemplate instance. */
export function isHTMLTemplate(x: any): x is HTMLTemplate {
  return x instanceof HTMLTemplate;
}

/** Checks if current html string is inside a tag. */
export function isInTag(html: string): boolean {
  for (let i = html.length - 1; i >= 0; i--) {
    if (html[i] === '<') return true;
    if (html[i] === '>') return false;
  }
  return false;
}
