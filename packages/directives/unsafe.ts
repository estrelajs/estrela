import { HTMLResult } from '../core';

/**
 * To prevent XSS attacks, Estrela escapes strings that contains HTML.
 * This directive bypasses this behavior.
 *
 * @param html html string
 * @returns unscaped html
 */
export function unsafe(html: string): HTMLResult {
  return new HTMLResult([html] as any, []);
}
