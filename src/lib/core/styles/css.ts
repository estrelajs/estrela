import postcss from 'postcss';
import prefixer from 'postcss-prefix-selector';
import { Component } from '../types';

export interface StyledComponent<T> extends Component<T> {
  styleId: string;
}

export const css =
  <T>(Component: Component<T>) =>
  (template: TemplateStringsArray, ...args: any[]): void => {
    const styledComponent = Component as StyledComponent<T>;
    if (!styledComponent.styleId) {
      styledComponent.styleId = createStyleId();
    }

    const style = document.createElement('style');
    const styleSheet = args.reduce(
      (acc: string, arg, i) => acc + String(arg) + template[i + 1],
      template[0]
    );

    style.textContent = postcss()
      .use(
        prefixer({
          prefix: `[_host-${styledComponent.styleId}]`,
          transform: (prefix: string, selector: string) => {
            return `${selector}${prefix}`;
          },
        })
      )
      .process(styleSheet).css;

    document.head.append(style);
  };

function createStyleId(): string {
  return [
    Math.random().toString(36).substring(2, 5),
    Math.random().toString(36).slice(2, 6),
  ].join('-');
}
