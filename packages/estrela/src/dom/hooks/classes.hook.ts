import { coerceObservable, Subscription } from '../../core';
import { nodeApi } from '../virtual-dom/node-api';
import { VirtualNode } from '../virtual-node';
import { Hook } from './types';

const subscriptons = new Map<any, Subscription>();

function hook(oldNode: VirtualNode, node: VirtualNode): void {
  const element = node.element ?? oldNode.element;
  let oldClasses = oldNode.data?.classes;
  let classes = node.data?.classes;

  if (!element || !nodeApi.isElement(element)) return;
  if (oldClasses === classes) return;
  oldClasses = oldClasses || {};
  classes = classes || {};

  for (let name in oldClasses) {
    const klass = oldClasses[name];
    subscriptons.get(klass)?.unsubscribe();
    element.classList.remove(name);
  }

  for (let name in classes) {
    const klass = classes[name];

    const subscription = coerceObservable(klass).subscribe(value => {
      const action = value ? 'add' : 'remove';
      element.classList[action](name);
    });

    subscriptons.set(klass, subscription);
  }
}

export const classesHook: Hook = {
  create: hook,
  update: hook,
};
