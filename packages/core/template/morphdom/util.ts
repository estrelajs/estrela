var range: Range; // Create a range object for efficently rendering strings to elements.
const NS_XHTML = 'http://www.w3.org/1999/xhtml';

export const doc = typeof document === 'undefined' ? undefined : document;
const HAS_TEMPLATE_SUPPORT = !!doc && 'content' in doc.createElement('template');
const HAS_RANGE_SUPPORT = !!doc && 'createContextualFragment' in doc.createRange?.();

function createFragmentFromTemplate(str: string): HTMLElement {
  var template = document.createElement('template');
  template.innerHTML = str;
  return template.content.childNodes[0] as HTMLElement;
}

function createFragmentFromRange(str: string): HTMLElement {
  if (!range) {
    range = document.createRange();
    range.selectNode(document.body);
  }

  var fragment = range.createContextualFragment(str);
  return fragment.childNodes[0] as HTMLElement;
}

function createFragmentFromWrap(str: string): HTMLElement {
  var fragment = document.createElement('body');
  fragment.innerHTML = str;
  return fragment.childNodes[0] as HTMLElement;
}

/**
 * This is about the same
 * var html = new DOMParser().parseFromString(str: string, 'text/html');
 * return html.body.firstChild;
 */
export function toElement(str: string): HTMLElement {
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

/**
 * Returns true if two node's names are the same.
 *
 * NOTE: We don't bother checking `namespaceURI` because you will never find two HTML elements with the same
 *       nodeName and different namespace URIs.
 */
export function compareNodeNames(fromEl: HTMLElement, toEl: HTMLElement): boolean {
  var fromNodeName = fromEl.nodeName;
  var toNodeName = toEl.nodeName;
  var fromCodeStart, toCodeStart;

  if (fromNodeName === toNodeName) {
    return true;
  }

  fromCodeStart = fromNodeName.charCodeAt(0);
  toCodeStart = toNodeName.charCodeAt(0);

  // If the target element is a virtual DOM node or SVG node then we may
  // need to normalize the tag name before comparing. Normal HTML elements that are
  // in the "http://www.w3.org/1999/xhtml"
  // are converted to upper case
  if (fromCodeStart <= 90 && toCodeStart >= 97) {
    // from is upper and to is lower
    return fromNodeName === toNodeName.toUpperCase();
  } else if (toCodeStart <= 90 && fromCodeStart >= 97) {
    // to is upper and from is lower
    return toNodeName === fromNodeName.toUpperCase();
  } else {
    return false;
  }
}

/**
 * Create an element, optionally with a known namespace URI.
 *
 * @param {string} name the element name, e.g. 'div' or 'svg'
 * @param {string} [namespaceURI] the element's namespace URI, i.e. the value of
 * its `xmlns` attribute or its inferred namespace.
 */
export function createElementNS(
  name: string,
  namespaceURI: string | null
): HTMLElement {
  return !namespaceURI || namespaceURI === NS_XHTML
    ? document.createElement(name)
    : (document.createElementNS(namespaceURI, name) as HTMLElement);
}

/**
 * Copies the children of one DOM element to another DOM element
 */
export function moveChildren(fromEl: HTMLElement, toEl: HTMLElement): HTMLElement {
  var curChild = fromEl.firstChild;
  while (curChild) {
    var nextChild = curChild.nextSibling;
    toEl.appendChild(curChild);
    curChild = nextChild;
  }
  return toEl;
}
