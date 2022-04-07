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

  const templateReducer =
    (template: TemplateStringsArray) =>
    (html: string, arg: unknown, idx: number): string => {
      const content = coerceArray(arg)
        .map(token => {
          // if is not in tag
          if (!/<[^>]*$/.test(html)) {
            if (typeof token === 'function') {
              token = token();
            }
          }

          if (isHTMLTemplate(token)) {
            return token.args.reduce(
              templateReducer(token.template),
              token.template[0]
            );
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
        })
        .join('');

      return `${html}${content}${template[idx + 1]}`;
    };

  const html = args.reduce(templateReducer(template), template[0]);

  return { html, tokens };
}

function isHTMLTemplate(x: any): x is HTMLTemplate {
  return x instanceof HTMLTemplate;
}
