import { StateSubject } from '../../observables/StateSubject';
import { DirectiveHooks } from '../../types';
import { isHtmlResult, isInTag } from '../../utils';
import { coerceArray, isDirective, isFalsy } from '../../utils/misc';

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
  render(args: any[], hooks: DirectiveHooks): string {
    if (this.template.length === 1) {
      return this.template[0];
    }

    const html = this.args.reduce((html: string, arg, idx) => {
      if (isDirective(arg)) {
        arg = arg.render(hooks);
      }

      const setContent = (content: string, wrapInComments?: boolean) => {
        if (wrapInComments) {
          content = `<!---->${content}<!---->`;
        }
        const nextHtml = this.template[idx + 1];
        return html + content + nextHtml;
      };

      // helpers
      const inTag = isInTag(html);
      const addQuote = /=$/.test(html) ? '"' : '';
      const argTemplates = coerceArray(arg).filter(isHtmlResult);

      // when arg is HtmlResult
      if (argTemplates.length > 0) {
        const content = argTemplates
          .map(result => result.render(args, hooks))
          .join('');
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

      // else render value right away
      const renderValue = (value: any): string => {
        if (isFalsy(value)) {
          return '';
        }
        if (Array.isArray(value)) {
          return value.map(v => renderValue(v)).join('');
        }
        return String(value);
      };

      const argValue = arg instanceof StateSubject ? arg() : arg;
      return setContent(renderValue(argValue), true);
    }, this.template[0]);

    return html;
  }
}
