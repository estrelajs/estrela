import { coerceObservable, Subscription } from '../../core';
import { coerceArray } from '../../utils';
import { h } from '../h';
import { nodeApi } from '../virtual-dom/node-api';
import { patch } from '../virtual-dom/patch';
import { VirtualNode } from '../virtual-node';
import { Hook } from './types';

const subscriptons = new WeakMap<Node, Subscription>();
const results = new WeakMap<Node, VirtualNode[]>();

function hook(oldNode: VirtualNode, node?: VirtualNode): void {
  const element = node?.element ?? oldNode.element;
  if (!element || !nodeApi.isDocumentFragment(element)) {
    return;
  }

  if (oldNode.observable !== node?.observable) {
    if (oldNode.observable) {
      subscriptons.get(element)?.unsubscribe();
      subscriptons.delete(element);
      results.delete(element);
    }

    if (node?.observable) {
      const observable = node.observable;
      let refNode = node;
      let isAsync = false;

      // observe changes
      const subscription = coerceObservable(node.observable).subscribe(
        value => {
          const patchNode = h(null, null, ...coerceArray(value));
          results.set(element, patchNode.children!);
          patchNode.observable = observable;

          if (isAsync) {
            refNode = patch(refNode, patchNode);
          } else {
            refNode.children = patchNode.children;
          }
        }
      );

      // add subscription to the map
      subscriptons.set(element, subscription);
      isAsync = true;
    }
  } else if (node?.observable) {
    const children = results.get(element);
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
