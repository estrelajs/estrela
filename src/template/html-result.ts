import { StateSubject } from '../observables/state_subject';
import { HTMLTemplate } from '../types';
import { coerceArray } from '../utils/coerce-array';

/** Type check for HtmlResult object. */
export function isHtmlResult(x: any): x is HTMLResult {
  return x instanceof HTMLResult;
}

export function isInTag(html: string): boolean {
  for (let i = html.length; i > 0; --i) {
    if (html[i] === '<') return true;
    if (html[i] === '>') return false;
  }
  return false;
}

/** HtmlResult contains the HTML data to be rendered. */
export class HTMLResult {
  constructor(
    public readonly template: TemplateStringsArray,
    public readonly args: any[]
  ) {}

  /**
   * Renders the HtmlResult object into string
   * @param args array to receive the template arguments
   * @returns html result string
   */
  render(args: any[]): string {
    if (this.template.length === 1) {
      return this.template[0];
    }

    const html = this.args.reduce((html: string, arg, idx) => {
      const setContent = (content: string) => {
        const nextHtml = this.template[idx + 1];
        return html + content + nextHtml;
      };

      // helpers
      const inTag = isInTag(html);
      const addQuote = /=$/.test(html) ? '"' : '';
      const argTemplates = coerceArray(arg).filter(isHtmlResult);

      // when arg is HtmlResult
      if (argTemplates.length > 0) {
        const content = argTemplates.map(result => result.render(args)).join('');
        return setContent(content);
      }

      // when we're inside a tag
      if (inTag) {
        let index = args.indexOf(arg);
        if (index === -1) {
          index = args.push(arg) - 1;
        }
        const content = `${addQuote}$$${index}${addQuote}`;
        return setContent(content);
      }

      // else render right away
      const renderValue = (value: any): string => {
        if (value === null || value === undefined || value === false) {
          return '';
        }
        if (Array.isArray(value)) {
          return value.map(v => renderValue(v)).join('');
        }
        return String(value);
      };
      const argValue = arg instanceof StateSubject ? arg() : arg;
      return setContent(`<!---->${renderValue(argValue)}<!---->`);
      // wrap content inside comments for better virtual dom diff.
    }, this.template[0]);

    return html;
  }

  /** create HtmlResult from a valid template value. */
  static create(template: HTMLTemplate): HTMLResult {
    return template instanceof HTMLResult
      ? template
      : new HTMLResult([String(template)] as any, []);
  }
}
