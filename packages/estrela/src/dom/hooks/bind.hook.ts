import { createSubscription, Observable, Subscription } from '../../core';
import { VirtualNode } from '../virtual-node';
import { Hook } from './types';

// TODO: improve bind hook

const subscriptons = new WeakMap<Observable<any>, Subscription>();

function hook(oldNode: VirtualNode, node?: VirtualNode): void {
  const element = oldNode.element ?? node?.element;
  if (oldNode.data?.bind !== node?.data?.bind) {
    if (oldNode.data?.bind) {
      subscriptons.get(oldNode.data.bind)?.unsubscribe();
    }

    if (element && node?.data?.bind) {
      const bind = node.data.bind;
      const handler = (event: Event) =>
        bind.next((event.target as HTMLInputElement).value);
      element.addEventListener('input', handler);
      const subscription = createSubscription(() =>
        element.removeEventListener('input', handler)
      );
      subscriptons.set(bind, subscription);
    }
  }
}

export const bindHook: Hook = {
  create: hook,
  update: hook,
  remove: hook,
};
