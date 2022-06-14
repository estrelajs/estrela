import { VirtualNode, walkNode } from './internal';

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
    let memo: VirtualNode;

    const styledComponent = (...args: any[]) => {
      const node: VirtualNode = Component.apply(undefined, args);
      if (!memo) {
        memo = node.cloneNode(true);
        if (!memo.isComponent) {
          walkNode(memo.template as Node, node => {
            (node as Element).setAttribute?.(`_${id}`, '');
          });
        }
      }
      (node as any).template = memo.template;
      return node;
    };

    const template = Array.from(css);
    const style = document.createElement('style');
    const styleSheet = cssArgs.reduce(
      (acc: string, arg, i) => acc + String(arg) + template[i + 1],
      template[0]
    );

    style.setAttribute('type', 'text/css');
    style.textContent = styleSheet;
    styledComponent.styleId = id;
    document.head.append(style);

    return styledComponent as any;
  };
}
