export class HTMLTemplate {
  constructor(
    public readonly template: TemplateStringsArray,
    public readonly args: unknown[]
  ) {}
}
