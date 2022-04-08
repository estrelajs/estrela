import { coerceArray } from '../../utils';
import { HTMLTemplate } from '../html';
import { VFragment } from '../vnode';
import { buildVNode } from './vnode-builder';

export interface HTMLTemplateResult {
  html: string;
  tokens: unknown[];
}

export function buildTemplate(template: HTMLTemplate): VFragment {
  const result = buildTemplateResult(template);
  return buildVNode(result) as VFragment;
}

function buildTemplateResult({
  template,
  args,
}: HTMLTemplate): HTMLTemplateResult {
  const tokens: unknown[] = [];
  const templateReducer =
    (template: TemplateStringsArray) =>
    (html: string, arg: unknown, idx: number): string => {
      // if is not in tag
      if (!/<[^>]*$/.test(html)) {
        if (typeof arg === 'function') {
          arg = arg();
        }
      }

      // rendered content
      const content = coerceArray(arg)
        .map(token => {
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

      // build string
      return `${html}${content}${template[idx + 1]}`;
    };
  const html = args.reduce(templateReducer(template), template[0]);
  return { html, tokens };
}

function isHTMLTemplate(x: any): x is HTMLTemplate {
  return x instanceof HTMLTemplate;
}
