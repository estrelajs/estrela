export class HTMLResult {
  constructor(
    public readonly template: TemplateStringsArray,
    public readonly args: unknown[]
  ) {}
}
