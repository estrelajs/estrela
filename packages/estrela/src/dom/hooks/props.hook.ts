import { coerceObservable, Subscription } from '../../core';
import { VirtualNode } from '../virtual-node';
import { Hook } from './types';

const subscriptons = new Map<any, Subscription>();

function hook(oldNode: VirtualNode, node?: VirtualNode): void {
  const element = node?.element ?? oldNode.element;
  let oldProps = oldNode.data?.props;
  let props = node?.data?.props;

  if (!element || oldProps === props) return;
  if (oldProps === props) return;
  oldProps = oldProps ?? {};
  props = props ?? {};

  for (let key in oldProps) {
    const prop = oldProps[key];
    subscriptons.get(prop)?.unsubscribe();
  }

  for (let key in props) {
    const prop = props[key];

    const subscription = coerceObservable(prop).subscribe(value => {
      if (node?.componentRef) {
        if (node.componentRef.getProp(key) !== value) {
          node.componentRef.setProp(key, value);
        }
      } else if ((element as any)[key] !== value) {
        (element as any)[key] = value;
      }
    });

    subscriptons.set(prop, subscription);
  }
}

export const propsHook: Hook = {
  create: hook,
  update: hook,
  remove: hook,
};
