import { StateSubject } from '../observables/state_subject';
import { HTMLTemplate } from '../types';
import { coerceArray } from '../utils/coerce-array';

export interface HTMLRender {
  html: string;
  args: any[];
}

export class HTMLResult {
  constructor(
    public readonly template: TemplateStringsArray,
    public readonly args: any[]
  ) {}

  // TODO: add custom class and style binding
  render(args: any[] = []): HTMLRender {
    const html =
      this.template.length === 1
        ? this.template[0]
        : this.args
            .reduce((acc: string, arg, idx) => {
              let content = '';
              if (/\s((on)?:\w+|ref)=\"?$/.test(acc)) {
                let index = args.indexOf(arg);
                if (index === -1) {
                  index = args.push(arg) - 1;
                }
                content = String(index);
              } else if (
                arg instanceof HTMLResult ||
                (Array.isArray(arg) && arg[0] instanceof HTMLResult)
              ) {
                content = coerceArray<HTMLResult>(arg)
                  .map(result => result.render(args).html)
                  .join('');
              } else if (
                !(arg instanceof StateSubject) &&
                typeof arg === 'function'
              ) {
                const index = args.push(arg) - 1;
                content = `<div _virtual-${index}></div>`;
              } else {
                const [isAttribute, hasQuotes] = Array.from(
                  /=(\")?$/.exec(acc)?.values() ?? []
                );
                let value = arg instanceof StateSubject ? arg() : arg;
                if (Array.isArray(value)) {
                  value = value.join('');
                }
                if (value === false) {
                  value = '';
                }
                value = String(value ?? '');
                if (!isAttribute) {
                  value = `<!---->${value}<!---->`;
                } else if (!hasQuotes) {
                  value = `"${value}"`;
                }
                content = value;
              }
              return acc + content + this.template[idx + 1];
            }, this.template[0])
            .trim();
    return { html, args };
  }

  static create(template: HTMLTemplate): HTMLResult {
    return typeof template === 'string'
      ? new HTMLResult([template] as any, [])
      : template;
  }
}
