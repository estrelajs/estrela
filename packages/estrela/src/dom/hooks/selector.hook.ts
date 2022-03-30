import { isObservable, Observable, Subscription } from '../../core';
import { coerceArray } from '../../utils';
import { h } from '../h';
import { patch } from '../virtual-dom/patch';
import { VirtualNode } from '../virtual-node';
import { Hook } from './types';

const subscriptons = new WeakMap<Observable<any>, Subscription>();
const results = new WeakMap<Observable<any>, any[]>();

function hook(oldNode: VirtualNode, node?: VirtualNode): void {
  if (oldNode.observable !== node?.observable) {
    if (oldNode.observable) {
      subscriptons.get(oldNode.observable)?.unsubscribe();
    }

    if (node && isObservable(node.observable)) {
      const observable = node.observable;

      // observe changes
      const subscription = observable.subscribe(value => {
        const children = coerceArray(value);
        const patchNode = h(null, null, ...children);
        results.set(observable, patchNode.children!);
        patchNode.observable = observable;

        if (oldNode.element) {
          oldNode = patch(oldNode, patchNode);
        } else {
          node.children = patchNode.children;
        }
      });

      // add subscription to the map
      subscriptons.set(observable, subscription);
      oldNode = node;
    }
  } else if (node?.observable) {
    node.children = results.get(node.observable);
  }
}

export const selectorHook: Hook = {
  create: hook,
  update: hook,
  remove: hook,
};
