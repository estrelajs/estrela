export class HTMLTemplate {
  constructor(
    public readonly template: TemplateStringsArray,
    public readonly args: unknown[]
  ) {}
}

export const html = (
  template: TemplateStringsArray,
  ...args: unknown[]
): HTMLTemplate => new HTMLTemplate(template, args);
