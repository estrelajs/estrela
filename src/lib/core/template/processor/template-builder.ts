import { coerceArray } from '../../utils';
import { HTMLTemplate } from '../html';

export interface HTMLTemplateResult {
  html: string;
  tokens: unknown[];
}

export function buildHTMLTemplate(template: HTMLTemplate): HTMLTemplateResult {
  const tokens: unknown[] = [];

  const templateReducer = (html: string, arg: unknown, idx: number): string => {
    const content = coerceArray(arg).map(token => {
      if (isHTMLTemplate(token)) {
        return token.args.reduce(templateReducer, token.template[0]);
      } else {
        let index = tokens.indexOf(token);
        if (index === -1) {
          index = tokens.push(token) - 1;
        }
        return `{{${index}}}`;
      }
    });

    return `${html}${content}${template.template[idx + 1]}`;
  };

  const html = template.args.reduce(templateReducer, template.template[0]);

  return { html, tokens };
}

function isHTMLTemplate(x: any): x is HTMLTemplate {
  return x instanceof HTMLTemplate;
}
