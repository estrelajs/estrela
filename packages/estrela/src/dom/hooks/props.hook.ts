import { coerceObservable, Subscription } from '../../core';
import { VirtualNode } from '../virtual-node';
import { Hook } from './types';

const subscriptons = new WeakMap<any, Subscription>();

function hook(oldNode: VirtualNode, node: VirtualNode): void {
  const element = node.element;
  let oldProps = oldNode.data?.props;
  let props = node.data?.props;

  if (!element || oldProps === props) return;
  oldProps = oldProps ?? {};
  props = props ?? {};

  for (let key in props) {
    const cur = props[key];
    const old = oldProps[key];

    if (old === cur) {
      continue;
    }

    subscriptons.get(old)?.unsubscribe();

    const subscription = coerceObservable(cur).subscribe(value => {
      if (node.componentRef) {
        if (node.componentRef.getProp(key) !== value) {
          node.componentRef.setProp(key, value);
        }
      } else if ((element as any)[key] !== value) {
        (element as any)[key] = value;
      }
    });

    if (typeof cur === 'object') {
      subscriptons.set(cur, subscription);
    }
  }

  for (let key in oldProps) {
    if (!(key in props)) {
      subscriptons.get(oldProps[key])?.unsubscribe();
    }
  }
}

export const propsHook: Hook = {
  create: hook,
  update: hook,
};
