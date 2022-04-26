import { coerceObservable, Subscription } from '../../core';
import { nodeApi } from '../virtual-dom/node-api';
import { Styles, VirtualNode } from '../virtual-node';
import { Hook } from './types';

const subscriptons = new Map<any, Subscription>();

function hook(oldNode: VirtualNode, node?: VirtualNode) {
  const element = node?.element ?? oldNode.element;
  const oldStyles = oldNode.data?.styles;
  const styles = node?.data?.styles;
  const oldStyle = oldNode.data?.style;
  const style = node?.data?.style;

  if (!element || !nodeApi.isHTMLElement(element)) {
    return;
  }

  if (oldStyles !== styles) {
    bindStyles(oldStyles ?? {}, styles ?? {}, element);
  }

  if (oldStyle !== style) {
    let oldStyles: Styles = {};
    subscriptons.get(element)?.unsubscribe();
    subscriptons.delete(element);

    if (style) {
      const subscription = coerceObservable(style).subscribe(value => {
        const styles = parseStyle(value);
        bindStyles(oldStyles, styles, element);
        oldStyles = styles;
      });
      subscriptons.set(element, subscription);
    }
  }
}

function bindStyles(oldStyles: Styles, styles: Styles, element: HTMLElement) {
  for (let key in oldStyles) {
    const style = oldStyles[key];
    if (style !== styles[key]) {
      subscriptons.get(key)?.unsubscribe();
      subscriptons.delete(key);
      element.style[key as any] = '';
    }
  }

  for (let key in styles) {
    const cur = styles[key];
    const old = oldStyles[key];
    if (cur !== old) {
      const subscription = coerceObservable(cur).subscribe(value => {
        element.style[key as any] = value;
      });
      subscriptons.set(key, subscription);
    }
  }
}

function parseStyle(style: string | Styles): Styles {
  if (typeof style !== 'string') {
    return style;
  }
  return String(style)
    .split(';')
    .reduce((acc, rule) => {
      const [key, value] = rule.split(':').map(s => s.trim());
      if (key.length > 0 && value.length > 0) {
        acc[key] = value;
      }
      return acc;
    }, {} as Styles);
}

export const stylesHook: Hook = {
  create: hook,
  update: hook,
  remove: hook,
};
