import { coerceObservable, Subscription } from '../../observables';
import { Attrs } from '../../types/node-data';
import { domApi } from '../domapi';
import { Hook, HookData } from './Hook';

const subscriptons = new Map<Node, Record<string, Subscription>>();

const xlinkNS = 'http://www.w3.org/1999/xlink';
const xmlNS = 'http://www.w3.org/XML/1998/namespace';
const colonChar = 58;
const xChar = 120;

export const attrsHook: Hook = {
  insert: hook,
  update: hook,
  remove: hook,
};

function hook(node: Node, { prev, next }: HookData): void {
  // element will always be the same, if both exists
  const empty: Attrs = {};
  const oldAttrs = prev?.attrs ?? empty;
  const attrs = next?.attrs ?? empty;
  const map = subscriptons.get(node) ?? {};

  if (!domApi.isElement(node) || oldAttrs === attrs) {
    return;
  }

  for (let key in oldAttrs) {
    const attr = oldAttrs[key];
    if (attr !== attrs[key]) {
      map[key]?.unsubscribe();
      node.removeAttribute(key);
    }
  }

  for (let key in attrs) {
    const cur = attrs[key];
    const old = oldAttrs[key];
    if (cur !== old) {
      const subscription = coerceObservable(cur).subscribe(value => {
        if (value === true) {
          node.setAttribute(key, '');
        } else if (value === false || value === undefined) {
          node.removeAttribute(key);
        } else {
          if (key.charCodeAt(0) !== xChar) {
            node.setAttribute(key, value as any);
          } else if (key.charCodeAt(3) === colonChar) {
            // Assume xml namespace
            node.setAttributeNS(xmlNS, key, value as any);
          } else if (key.charCodeAt(5) === colonChar) {
            // Assume xlink namespace
            node.setAttributeNS(xlinkNS, key, value as any);
          } else {
            node.setAttribute(key, value as any);
          }
        }
      });
      map[key] = subscription;
      subscriptons.set(node, map);
    }
  }
}
