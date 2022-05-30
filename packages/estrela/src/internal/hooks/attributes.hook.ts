import { tryParseObservable } from '../../observables';
import { nodeApi } from '../node-api';
import { PROPS_SYMBOL } from '../symbols';
import { NodeHook } from './node-hook';

const xlinkNS = 'http://www.w3.org/1999/xlink';
const xmlNS = 'http://www.w3.org/XML/1998/namespace';
const colonChar = 58;
const xChar = 120;

export const attributesHook: NodeHook = {
  mount(node) {
    if (nodeApi.isTextElement(node)) {
      return;
    }

    const props = Reflect.getMetadata(PROPS_SYMBOL, node);
    for (let key in props) {
      if (isAttribute(key)) {
        const attrValue = props[key];
        try {
          const subscription = tryParseObservable(attrValue).subscribe(
            value => {
              applyAttribute(node as Element, key, value);
            },
            { initialEmit: true }
          );
        } catch {
          applyAttribute(node as Element, key, attrValue);
        }
      }
    }
  },
};

function applyAttribute(element: Element, attr: string, value: any): void {
  if (value === true) {
    element.setAttribute(attr, '');
  } else if (value === false || value === undefined) {
    element.removeAttribute(attr);
  } else {
    if (attr.charCodeAt(0) !== xChar) {
      element.setAttribute(attr, value as any);
    } else if (attr.charCodeAt(3) === colonChar) {
      // Assume xml namespace
      element.setAttributeNS(xmlNS, attr, value as any);
    } else if (attr.charCodeAt(5) === colonChar) {
      // Assume xlink namespace
      element.setAttributeNS(xlinkNS, attr, value as any);
    } else {
      element.setAttribute(attr, value as any);
    }
  }
}

function isAttribute(key: string): boolean {
  return !key.includes(':') && !['children', 'class', 'style'].includes(key);
}
