import { coerceArray } from '../../utils';
import { HTMLTemplate } from '../html';

export interface HTMLTemplateResult {
  html: string;
  tokens: unknown[];
}

export function buildHTMLTemplate({
  template,
  args,
}: HTMLTemplate): HTMLTemplateResult {
  const tokens: unknown[] = [];

  const templateReducer = (html: string, arg: unknown, idx: number): string => {
    const content = coerceArray(arg).map(token => {
      if (isHTMLTemplate(token)) {
        const { template, args } = token;
        return args.reduce(templateReducer, template[0]);
      } else {
        // match quotes
        let [match, quotes] = /<[^>]*=\s*(['"])?$/.exec(html) ?? [];
        quotes = match && !quotes ? '"' : '';

        // add token
        let index = tokens.indexOf(token);
        if (index === -1) {
          index = tokens.push(token) - 1;
        }

        return `${quotes}{{${index}}}${quotes}`;
      }
    });

    return `${html}${content}${template[idx + 1]}`;
  };

  const html = args.reduce(templateReducer, template[0]);

  return { html, tokens };
}

function isHTMLTemplate(x: any): x is HTMLTemplate {
  return x instanceof HTMLTemplate;
}
