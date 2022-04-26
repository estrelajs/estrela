import { coerceObservable, Subscription } from '../../core';
import { coerceArray } from '../../utils';
import { h } from '../h';
import { patch } from '../virtual-dom/patch';
import { VirtualNode } from '../virtual-node';
import { Hook } from './types';

const subscriptons = new Map<any, Subscription>();
const results = new Map<any, VirtualNode[]>();

function hook(oldNode: VirtualNode, node?: VirtualNode): void {
  if (oldNode.observable !== node?.observable) {
    if (oldNode.observable) {
      subscriptons.get(oldNode.observable)?.unsubscribe();
      subscriptons.delete(oldNode.observable);
      results.delete(oldNode.observable);
    }

    if (node?.observable) {
      const observable = node.observable;
      let refNode = node;
      let isAsync = false;

      // observe changes
      const subscription = coerceObservable(node.observable).subscribe(
        value => {
          const patchNode = h(null, null, ...coerceArray(value));
          results.set(observable, patchNode.children!);
          patchNode.observable = observable;

          if (isAsync) {
            refNode = patch(refNode, patchNode);
          } else {
            refNode.children = patchNode.children;
          }
        }
      );

      // add subscription to the map
      subscriptons.set(observable, subscription);
      isAsync = true;
    }
  } else if (node?.observable) {
    const children = results.get(node.observable);
    if (children) {
      node.children = children;
    }
  }
}

export const observableHook: Hook = {
  create: hook,
  update: hook,
  remove: hook,
};
