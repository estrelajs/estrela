import { Component } from './types';

export interface StyledComponent<P = {}, C = JSX.Children>
  extends Component<P, C> {
  styleId?: string;
}

export const styled =
  <T, C>(component: Component<T, C>) =>
  (css: TemplateStringsArray, ...cssArgs: any[]) => {
    const template = Array.from(css);
    const styledComponent: StyledComponent<T, C> = (...args: any[]) => {
      return component.apply(undefined, args as any);
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

    return styledComponent;
  };

function isStyleId(id: string): boolean {
  return /^[a-z0-9]{5}$/.test(id);
}
