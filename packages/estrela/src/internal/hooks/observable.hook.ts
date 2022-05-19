import { coerceObservable, Subscription } from '../../observables';
import { coerceArray } from '../../utils';
import { domApi } from '../domapi';
import { h } from '../h';
import { patch } from '../virtual-dom/patch';
import { VirtualNode } from '../virtual-dom/virtual-node';
import { Hook } from './Hook';

const NODE_SUBSCRIPTION_MAP = new WeakMap<Node, Subscription>();
const LAST_NODE_MAP = new WeakMap<Node, VirtualNode>();

export const observableHook: Hook = {
  create: hook,
  update: hook,
  remove: hook,
};

function hook(oldNode: VirtualNode, node?: VirtualNode): void {
  const element = node?.element ?? oldNode.element;
  if (!element || !domApi.isDocumentFragment(element)) {
    return;
  }

  if (oldNode.observable !== node?.observable) {
    NODE_SUBSCRIPTION_MAP.get(element)?.unsubscribe();
    NODE_SUBSCRIPTION_MAP.delete(element);

    if (node?.observable) {
      // observe changes
      const subscription = coerceObservable(node.observable).subscribe(
        value => {
          let lastNode = LAST_NODE_MAP.get(element);
          const patchNode = h(null, null, ...coerceArray(value));
          patchNode.element = element;

          if (!patchNode.children?.length) {
            setEmptyText(patchNode);
          }

          if (lastNode) {
            lastNode = patch(lastNode, patchNode);
          } else {
            lastNode = patchNode;
            patchNode.createElement();
          }

          LAST_NODE_MAP.set(element, lastNode);
        },
        { initialEmit: true }
      );

      if (!LAST_NODE_MAP.has(element)) {
        const lastNode = h();
        lastNode.element = element;
        LAST_NODE_MAP.set(element, lastNode);
        setEmptyText(lastNode);
      }

      // add subscription to the map
      NODE_SUBSCRIPTION_MAP.set(element, subscription);
    } else {
      const lastNode = LAST_NODE_MAP.get(element);
      if (lastNode) {
        oldNode.children = lastNode.children;
      }
    }
  }
}

function setEmptyText(node: VirtualNode): void {
  const text = h('#');
  const element = text.createElement();
  node.element?.appendChild(element);
  node.children = [text];
}
