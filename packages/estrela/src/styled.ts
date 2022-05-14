export type StyledTemplate<C> = (
  css: TemplateStringsArray,
  ...cssArgs: any[]
) => C;

export function styled<C extends Function>(Component: C): StyledTemplate<C> {
  return (css, ...cssArgs) => {
    const template = Array.from(css);
    const styledComponent = (...args: any[]) => {
      return Component.apply(undefined, args as any);
    };

    if (isStyleId(cssArgs[0])) {
      styledComponent.styleId = cssArgs[0];
      template.shift();
      cssArgs.shift();
    }

    const style = document.createElement('style');
    const styleSheet = cssArgs.reduce(
      (acc: string, arg, i) => acc + String(arg) + template[i + 1],
      template[0]
    );

    style.setAttribute('type', 'text/css');
    style.textContent = styleSheet;
    document.head.append(style);

    return styledComponent as any;
  };
}

function isStyleId(id: string): boolean {
  return /^[a-z0-9]{5}$/.test(id);
}
