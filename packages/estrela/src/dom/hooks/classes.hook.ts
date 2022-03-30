import { coerceObservable, Subscription } from '../../core';
import { nodeApi } from '../virtual-dom/node-api';
import { VirtualNode } from '../virtual-node';
import { Hook } from './types';

const subscriptons = new WeakMap<any, Subscription>();

function hook(oldNode: VirtualNode, node: VirtualNode): void {
  const element = node.element as Element | undefined;
  let oldClasses = oldNode.data?.classes;
  let classes = node.data?.classes;

  if (!element || !nodeApi.isElement(element)) return;
  if (oldClasses === classes) return;
  oldClasses = oldClasses || {};
  classes = classes || {};

  for (let name in classes) {
    const cur = classes[name];
    const old = oldClasses[name];

    if (old === cur) {
      continue;
    }

    subscriptons.get(old)?.unsubscribe();

    const subscription = coerceObservable(cur).subscribe(value => {
      const action = value ? 'add' : 'remove';
      element.classList[action](name);
    });

    if (typeof cur === 'object') {
      subscriptons.set(cur, subscription);
    }
  }

  for (let name in oldClasses) {
    if (!(name in classes)) {
      const old = oldClasses[name];
      subscriptons.get(old)?.unsubscribe();
      element.classList.remove(name);
    }
  }
}

export const classesHook: Hook = {
  create: hook,
  update: hook,
};
