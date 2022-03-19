import { PROPERTIES_TOKEN } from '../core/properties/properties';
import { ElementProperties } from '../types/ElementProperties';

var range: Range; // Create a range object for efficently rendering strings to elements.
const doc = typeof document === 'undefined' ? undefined : document;
const HAS_TEMPLATE_SUPPORT = !!doc && 'content' in doc.createElement('template');
const HAS_RANGE_SUPPORT = !!doc && 'createContextualFragment' in doc.createRange?.();

function createFragmentFromTemplate(str: string): Element {
  var template = document.createElement('template');
  template.innerHTML = str;
  return template.content.childNodes[0] as Element;
}

function createFragmentFromRange(str: string): Element {
  if (!range) {
    range = document.createRange();
    range.selectNode(document.body);
  }

  var fragment = range.createContextualFragment(str);
  return fragment.childNodes[0] as Element;
}

function createFragmentFromWrap(str: string): Element {
  var fragment = document.createElement('body');
  fragment.innerHTML = str;
  return fragment.childNodes[0] as Element;
}

/**
 * This is about the same
 * var html = new DOMParser().parseFromString(str: string, 'text/html');
 * return html.body.firstChild;
 */
export function toElement(str: string): Element {
  str = str.trim();
  if (HAS_TEMPLATE_SUPPORT) {
    // avoid restrictions on content for things like `<tr><th>Hi</th></tr>` which
    // createContextualFragment doesn't support
    // <template> support not available in IE
    return createFragmentFromTemplate(str);
  } else if (HAS_RANGE_SUPPORT) {
    return createFragmentFromRange(str);
  }
  return createFragmentFromWrap(str);
}

/** Get reflected value from element properties. */
export function getElementProperty<K extends keyof ElementProperties>(
  element: Element,
  key: K
): ElementProperties[K] | undefined {
  const properties = Reflect.getOwnMetadata(
    PROPERTIES_TOKEN,
    element
  ) as ElementProperties;
  return properties?.[key];
}
