import {
  coerceObservable,
  createSubscription,
  Subscription,
} from '../../observables';
import { Styles } from '../../types/node-data';
import { domApi } from '../domapi';
import { Hook } from './Hook';

interface Cleanup {
  keys: Subscription;
  node: Subscription;
}

const NODE_CLEANUP = new WeakMap<Node, Cleanup>();

export const stylesHook: Hook = {
  insert(node, data) {
    if (!domApi.isHTMLElement(node) || (!data.style && !data.styles)) {
      return;
    }

    const cleanup = NODE_CLEANUP.get(node) ?? {
      keys: createSubscription(),
      node: createSubscription(),
    };
    NODE_CLEANUP.set(node, cleanup);

    const subscription = coerceObservable(data.style).subscribe(style => {
      const styles = { ...parseStyle(style), ...data.styles };
      cleanup.keys.unsubscribe();
      cleanup.keys = createSubscription();

      for (let key in styles) {
        const subscription = coerceObservable(styles[key]).subscribe(value => {
          node.style[key as any] = value;
        });
        cleanup.keys.add(subscription);
        cleanup.keys.add(() => {
          node.style[key as any] = '';
        });
      }
    });
    cleanup?.node.add(subscription);
  },
  update(node, data) {
    this.insert?.(node, data);
  },
  remove(node) {
    const cleanup = NODE_CLEANUP.get(node);
    cleanup?.keys.unsubscribe();
    cleanup?.node.unsubscribe();
  },
};

function parseStyle(style?: string | Styles): Styles {
  if (typeof style !== 'string') {
    return style ?? {};
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
