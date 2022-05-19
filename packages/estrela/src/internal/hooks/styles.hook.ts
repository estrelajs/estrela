import { coerceObservable, Subscription } from '../../observables';
import { Styles } from '../../types/data';
import { domApi } from '../domapi';
import { VirtualNode } from '../virtual-dom/virtual-node';
import { Hook } from './Hook';

const NODE_SUBSCRIPTIONS_MAP = new WeakMap<
  Node,
  Record<string, Subscription>
>();

export const stylesHook: Hook = {
  create: hook,
  update: hook,
  remove: hook,
};

function hook(oldNode: VirtualNode, node?: VirtualNode) {
  const element = node?.element ?? oldNode.element;
  const oldStyles = oldNode.data?.styles;
  const styles = node?.data?.styles;
  const oldStyle = oldNode.data?.style;
  const style = node?.data?.style;

  if (!element || !domApi.isHTMLElement(element)) {
    return;
  }

  if (oldStyles !== styles) {
    bindStyles(oldStyles ?? {}, styles ?? {}, element);
  }

  if (oldStyle !== style) {
    let oldStyles: Styles = {};
    const map = NODE_SUBSCRIPTIONS_MAP.get(element) ?? {};
    map[0]?.unsubscribe();
    delete map[0];

    if (style) {
      map[0] = coerceObservable(style).subscribe(value => {
        const styles = parseStyle(value);
        bindStyles(oldStyles, styles, element);
        oldStyles = styles;
      });
    }

    NODE_SUBSCRIPTIONS_MAP.set(element, map);
  }
}

function bindStyles(oldStyles: Styles, styles: Styles, element: HTMLElement) {
  const map = NODE_SUBSCRIPTIONS_MAP.get(element) ?? {};

  for (let key in oldStyles) {
    const style = oldStyles[key];
    if (style !== styles[key]) {
      map[key]?.unsubscribe();
      element.style[key as any] = '';
      delete map[key];
    }
  }

  for (let key in styles) {
    const cur = styles[key];
    const old = oldStyles[key];
    if (cur !== old) {
      map[key] = coerceObservable(cur).subscribe(value => {
        element.style[key as any] = value;
      });
    }
  }

  NODE_SUBSCRIPTIONS_MAP.set(element, map);
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
