import { coerceObservable, Subscription } from '../../observables';
import { domApi } from '../domapi';
import { VirtualNode } from '../virtual-dom/virtual-node';
import { Hook } from './Hook';

const NODE_SUBSCRIPTIONS_MAP = new WeakMap<
  Node,
  Record<string, Subscription>
>();

const xlinkNS = 'http://www.w3.org/1999/xlink';
const xmlNS = 'http://www.w3.org/XML/1998/namespace';
const colonChar = 58;
const xChar = 120;

export const attrsHook: Hook = {
  create: hook,
  update: hook,
  remove: hook,
};

function hook(oldNode: VirtualNode, node?: VirtualNode): void {
  // element will always be the same, if both exists
  const element = node?.element ?? oldNode.element;
  const oldAttrs = oldNode.data?.attrs ?? {};
  const attrs = node?.data?.attrs ?? {};

  if (!element || !domApi.isElement(element) || oldAttrs === attrs) {
    return;
  }

  const map = NODE_SUBSCRIPTIONS_MAP.get(element) ?? {};

  for (let key in oldAttrs) {
    const attr = oldAttrs[key];
    if (attr !== attrs[key]) {
      map[key]?.unsubscribe();
      element.removeAttribute(key);
      delete map[key];
    }
  }

  for (let key in attrs) {
    const cur = attrs[key];
    const old = oldAttrs[key];
    if (cur !== old) {
      map[key] = coerceObservable(cur).subscribe(value => {
        if (value === true) {
          element.setAttribute(key, '');
        } else if (value === false || value === undefined) {
          element.removeAttribute(key);
        } else {
          if (key.charCodeAt(0) !== xChar) {
            element.setAttribute(key, value as any);
          } else if (key.charCodeAt(3) === colonChar) {
            // Assume xml namespace
            element.setAttributeNS(xmlNS, key, value as any);
          } else if (key.charCodeAt(5) === colonChar) {
            // Assume xlink namespace
            element.setAttributeNS(xlinkNS, key, value as any);
          } else {
            element.setAttribute(key, value as any);
          }
        }
      });
    }
  }

  NODE_SUBSCRIPTIONS_MAP.set(element, map);
}
