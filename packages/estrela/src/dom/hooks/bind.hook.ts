import { Observable } from '../../core';
import { VirtualNode } from '../virtual-node';
import { Hook } from './types';

// TODO: improve bind hook

const subscriptons = new WeakMap<Observable<any>, Function>();

function hook(oldNode: VirtualNode, node?: VirtualNode): void {
  if (oldNode.data?.bind !== node?.data?.bind) {
    const element = oldNode.element ?? node?.element;
    if (oldNode.data?.bind) {
      subscriptons.get(oldNode.data.bind)?.();
    }

    if (element && node?.data?.bind) {
      const bind = node.data.bind;
      const handler = (event: Event) =>
        bind.next((event.target as HTMLInputElement).value);
      element.addEventListener('input', handler);
      subscriptons.set(bind, () =>
        element.removeEventListener('input', handler)
      );
    }
  }
}

export const bindHook: Hook = {
  create: hook,
  update: hook,
  remove: hook,
};
