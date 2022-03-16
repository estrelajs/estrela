import { HTMLResult } from '../core';

/** Type check for HtmlResult object. */
export function isHtmlResult(x: any): x is HTMLResult {
  return x instanceof HTMLResult;
}

/** Checks if current html string is inside a tag. */
export function isInTag(html: string): boolean {
  for (let i = html.length; i > 0; --i) {
    if (html[i] === '<') return true;
    if (html[i] === '>') return false;
  }
  return false;
}
