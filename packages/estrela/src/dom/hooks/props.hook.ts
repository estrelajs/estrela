import { coerceObservable, Subscription } from '../../core';
import { ComponentRef } from '../virtual-dom/component-ref';
import { VirtualNode } from '../virtual-node';
import { Hook } from './types';

const subscriptons = new Map<any, Subscription>();
const componentRefs = new WeakMap<Node, ComponentRef>();

function hook(oldNode: VirtualNode, node?: VirtualNode): void {
  // element will always be the same, if both exists
  const element = node?.element ?? oldNode.element;
  const oldProps = oldNode.data?.props ?? {};
  const props = node?.data?.props ?? {};

  if (!element || oldProps === props) {
    return;
  }

  if (node?.componentRef) {
    componentRefs.set(element, node.componentRef);
  }

  for (let key in oldProps) {
    const prop = oldProps[key];
    if (prop !== props[key]) {
      subscriptons.get(key)?.unsubscribe();
      subscriptons.delete(key);
    }
  }

  for (let key in props) {
    const cur = props[key];
    const old = oldProps[key];

    if (cur === old) {
      const curRef = node?.componentRef;
      const oldRef = oldNode.componentRef;
      if (oldRef && curRef !== oldRef) {
        const oldValue = oldRef.getProp(key);
        curRef?.setProp(key, oldValue);
      }
    } else {
      const defaultValue = (element as any)[key];
      const unsubscribe = () => {
        (element as any)[key] = defaultValue;
      };
      const subscription = coerceObservable(cur).subscribe(value => {
        if (componentRefs.has(element)) {
          const compRef = componentRefs.get(element)!;
          if (compRef.getProp(key) !== value) {
            compRef.setProp(key, value);
          }
        } else if ((element as any)[key] !== value) {
          (element as any)[key] = value;
        }
      });
      subscription.add({ unsubscribe });
      subscriptons.set(key, subscription);
    }
  }
}

export const propsHook: Hook = {
  create: hook,
  update: hook,
  remove: hook,
};
