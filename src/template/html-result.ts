import { StateSubject } from '../observables/state_subject';
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
              } else if (arg instanceof HTMLResult || Array.isArray(arg)) {
                content = coerceArray<HTMLResult>(arg)
                  .map(result => result.render(args).html)
                  .join('');
              } else if (typeof arg === 'function') {
                const index = args.push(arg) - 1;
                content = `<div _virtual-${index}></div>`;
              } else {
                const [isAttribute, hasQuotes] = Array.from(
                  /=(\")?$/.exec(acc)?.values() ?? []
                );
                const value = arg instanceof StateSubject ? arg() : arg;
                content = String(value === false ? '' : value ?? '');
                if (!isAttribute) {
                  content = `<!---->${content}<!---->`;
                } else if (!hasQuotes) {
                  content = `"${content}"`;
                }
              }
              return acc + content + this.template[idx + 1];
            }, this.template[0])
            .trim();
    return { html, args };
  }

  static create(template: string | HTMLResult): HTMLResult {
    return typeof template === 'string'
      ? new HTMLResult([template] as any, [])
      : template;
  }
}
