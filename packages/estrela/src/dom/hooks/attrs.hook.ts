import { coerceObservable, Subscription } from '../../core';
import { nodeApi } from '../virtual-dom/node-api';
import { VirtualNode } from '../virtual-node';
import { Hook } from './types';

const subscriptons = new Map<any, Subscription>();

const xlinkNS = 'http://www.w3.org/1999/xlink';
const xmlNS = 'http://www.w3.org/XML/1998/namespace';
const colonChar = 58;
const xChar = 120;

function hook(oldNode: VirtualNode, node?: VirtualNode): void {
  const element = node?.element ?? oldNode.element;
  let oldAttrs = oldNode.data?.attrs;
  let attrs = node?.data?.attrs;

  if (!element || !nodeApi.isElement(element)) return;
  if (oldAttrs === attrs) return;
  oldAttrs = oldAttrs ?? {};
  attrs = attrs ?? {};

  for (let key in oldAttrs) {
    const attr = oldAttrs[key];
    subscriptons.get(attr)?.unsubscribe();
    subscriptons.delete(attr);
  }

  for (let key in attrs) {
    const attr = attrs[key];

    const subscription = coerceObservable(attr).subscribe(value => {
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

    subscriptons.set(attr, subscription);
  }
}

export const attrsHook: Hook = {
  create: hook,
  update: hook,
  remove: hook,
};
