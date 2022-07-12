export type StyledTemplate<C> = (
  css: TemplateStringsArray,
  ...cssArgs: any[]
) => C;

export function styled<C extends Function>(Component: C): StyledTemplate<C>;
export function styled<C extends Function>(
  Component: C,
  id: string
): StyledTemplate<C>;
export function styled<C extends Function>(
  Component: C,
  id?: string
): StyledTemplate<C> {
  if (!id) {
    throw new Error('id is required');
  }

  return (css, ...cssArgs) => {
    const template = Array.from(css);
    const style = document.createElement('style');
    const styleSheet = cssArgs.reduce(
      (acc: string, arg, i) => acc + String(arg) + template[i + 1],
      template[0]
    );

    style.setAttribute('type', 'text/css');
    style.textContent = styleSheet;
    document.head.append(style);

    const styledComponent = (...args: any[]) =>
      Component.apply(undefined, args);
    styledComponent.styleId = id;
    return styledComponent as any;
  };
}
