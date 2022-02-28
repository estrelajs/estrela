export const css = (template: TemplateStringsArray, ...args: any[]): string =>
  template.length === 1
    ? template[0]
    : args.reduce((acc, v, idx) => acc + String(v) + template[idx + 1], template[0]);
