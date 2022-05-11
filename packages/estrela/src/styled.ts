import { Component } from './types';
import postcss from 'postcss';
import postcssPrefixer from 'postcss-prefix-selector';
import postcssNested from 'postcss-nested';

export interface StyledComponent<P = {}, C = JSX.Children>
  extends Component<P, C> {
  styleId: string;
}

export const styled =
  <T, C>(component: Component<T, C>) =>
  (css: TemplateStringsArray, ...cssArgs: any[]) => {
    const styledComponent: StyledComponent<T, C> = ((...args: any[]) =>
      component.apply(undefined, args as any)) as any;
    styledComponent.styleId = createStyleId();

    const style = document.createElement('style');
    const styleSheet = cssArgs.reduce(
      (acc: string, arg, i) => acc + String(arg) + css[i + 1],
      css[0]
    );

    style.setAttribute('type', 'text/css');
    style.textContent = postcss([
      postcssNested(),
      postcssPrefixer({
        prefix: `[${styledComponent.styleId}]`,
        transform: (prefix, selector) => {
          return `${selector}${prefix}`;
        },
      }) as any,
    ]).process(styleSheet).css;

    document.head.append(style);
    return styledComponent;
  };

function createStyleId(): string {
  return (
    '_' +
    [
      Math.random().toString(36).substring(2, 5),
      Math.random().toString(36).slice(2, 6),
    ].join('-')
  );
}
