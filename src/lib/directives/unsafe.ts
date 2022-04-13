import { HTMLTemplate } from '../dom';

/**
 * To prevent XSS attacks, Estrela escapes strings that contains HTML.
 * This directive bypasses this behavior.
 *
 * @param html html string
 * @returns unscaped html
 */
export function unsafe(html: string): HTMLTemplate {
  return new HTMLTemplate([html] as any, []);
}
