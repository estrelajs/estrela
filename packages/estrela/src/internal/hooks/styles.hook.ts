import { coerceObservable, Subscription } from '../../observables';
import { Styles } from '../../types/node-data';
import { domApi } from '../tools/domapi';
import { Hook, HookData } from './Hook';

const subscriptons = new WeakMap<Node, Record<string, Subscription>>();

export const stylesHook: Hook = {
  insert: hook,
  update: hook,
  remove: hook,
};

function hook(node: Node, { prev, next }: HookData) {
  const oldStyles = prev?.styles;
  const styles = next?.styles;
  const oldStyle = prev?.style;
  const style = next?.style;

  if (!domApi.isHTMLElement(node)) {
    return;
  }

  if (oldStyles !== styles) {
    bindStyles(node, oldStyles ?? {}, styles ?? {});
  }

  if (oldStyle !== style) {
    let oldStyles: Styles = {};
    const map = subscriptons.get(node) ?? {};
    map[0]?.unsubscribe();

    if (style) {
      const subscription = coerceObservable(style).subscribe(value => {
        const styles = parseStyle(value);
        bindStyles(node, oldStyles, styles);
        oldStyles = styles;
      });
      map[0] = subscription;
      subscriptons.set(node, map);
    }
  }
}

function bindStyles(node: HTMLElement, oldStyles: Styles, styles: Styles) {
  const map = subscriptons.get(node) ?? {};

  for (let key in oldStyles) {
    const style = oldStyles[key];
    if (style !== styles[key]) {
      map[key]?.unsubscribe();
      node.style[key as any] = '';
    }
  }

  for (let key in styles) {
    const cur = styles[key];
    const old = oldStyles[key];
    if (cur !== old) {
      const subscription = coerceObservable(cur).subscribe(value => {
        node.style[key as any] = value;
      });
      map[key] = subscription;
      subscriptons.set(node, map);
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
