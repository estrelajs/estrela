import { escape } from 'html-escaper';
import { StateSubject } from '../observables/StateSubject';
import { isHTMLTemplate, isInTag } from '../../utils';
import { coerceArray, isFalsy } from '../../utils/misc';

export class HTMLTemplate {
  constructor(
    public readonly template: TemplateStringsArray,
    public readonly args: any[]
  ) {}

  /**
   * Renders the HTML template into string.
   * @param args array reference to receive the template arguments
   * @returns html result string
   */
  render(args: any[]): string {
    if (this.template.length === 1) {
      return this.template[0];
    }

    const html = this.args.reduce((html: string, arg, idx) => {
      const renderContent = (content: string, wrapInComments?: boolean) => {
        if (wrapInComments) {
          content = `<!---->${escape(content)}<!---->`;
        }
        const nextHtml = this.template[idx + 1];
        return html + content + nextHtml;
      };

      // helpers
      const inTag = isInTag(html);
      const addQuote = /=$/.test(html) ? '"' : '';
      const argTemplates = coerceArray(arg).filter(isHTMLTemplate);

      // when arg is HTMLTemplate
      if (argTemplates.length > 0) {
        const content = argTemplates.map(result => result.render(args)).join('');
        return renderContent(content);
      }

      // when we're inside a tag
      if (inTag) {
        let index = args.indexOf(arg);
        if (index === -1) {
          index = args.push(arg) - 1;
        }
        const content = `${addQuote}$$${index}${addQuote}`;
        return renderContent(content);
      }

      // else render value right away
      const parseValue = (value: any): string => {
        if (isFalsy(value)) {
          return '';
        }
        if (Array.isArray(value)) {
          return value.map(v => parseValue(v)).join('');
        }
        return String(value);
      };

      const argValue = arg instanceof StateSubject ? arg() : arg;
      return renderContent(parseValue(argValue), true);
    }, this.template[0]);

    return html;
  }
}
