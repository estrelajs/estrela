import { coerceObservable, Subscription } from '../../core';
import { nodeApi } from '../virtual-dom/node-api';
import { VirtualNode } from '../virtual-node';
import { Hook } from './types';

const subscriptons = new WeakMap<any, Subscription>();

const xlinkNS = 'http://www.w3.org/1999/xlink';
const xmlNS = 'http://www.w3.org/XML/1998/namespace';
const colonChar = 58;
const xChar = 120;

function hook(oldNode: VirtualNode, node: VirtualNode): void {
  const element = node.element as Element | undefined;
  let oldAttrs = oldNode.data?.attrs;
  let attrs = node.data?.attrs;

  if (!element || !nodeApi.isElement(element)) return;
  if (oldAttrs === attrs) return;
  oldAttrs = oldAttrs ?? {};
  attrs = attrs ?? {};

  // update modified attributes, add new attributes
  for (let key in attrs) {
    const cur = attrs[key];
    const old = oldAttrs[key];

    if (old === cur) {
      continue;
    }

    subscriptons.get(old)?.unsubscribe();

    const subscription = coerceObservable(cur).subscribe(value => {
      if (value === true) {
        element.setAttribute(key, '');
      } else if (value === false) {
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

    if (typeof cur === 'object') {
      subscriptons.set(cur, subscription);
    }
  }

  // remove removed attributes
  // use `in` operator since the previous `for` iteration uses it (.i.e. add even attributes with undefined value)
  // the other option is to remove all attributes with value == undefined
  for (let key in oldAttrs) {
    if (!(key in attrs)) {
      const old = oldAttrs[key];
      subscriptons.get(old)?.unsubscribe();
      element.removeAttribute(key);
    }
  }
}

export const attrsHook: Hook = {
  create: hook,
  update: hook,
};
