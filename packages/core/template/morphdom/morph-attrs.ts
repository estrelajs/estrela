const DOCUMENT_FRAGMENT_NODE = 11;

export function morphAttrs(fromNode: HTMLElement, toNode: HTMLElement): void {
  const toNodeAttrs = toNode.attributes;

  // document-fragments dont have attributes so lets not do anything
  if (
    toNode.nodeType === DOCUMENT_FRAGMENT_NODE ||
    fromNode.nodeType === DOCUMENT_FRAGMENT_NODE
  ) {
    return;
  }

  // update attributes on original DOM element
  for (var i = toNodeAttrs.length - 1; i >= 0; i--) {
    const attr = toNodeAttrs[i];
    let attrName = attr.name;
    const attrNamespaceURI = attr.namespaceURI;
    const attrValue = attr.value;

    if (attrNamespaceURI) {
      attrName = attr.localName || attrName;
      const fromValue = fromNode.getAttributeNS(attrNamespaceURI, attrName);

      if (fromValue !== attrValue) {
        if (attr.prefix === 'xmlns') {
          attrName = attr.name; // It's not allowed to set an attribute with the XMLNS namespace without specifying the `xmlns` prefix
        }
        fromNode.setAttributeNS(attrNamespaceURI, attrName, attrValue);
      }
    } else {
      const fromValue = fromNode.getAttribute(attrName);

      if (fromValue !== attrValue) {
        fromNode.setAttribute(attrName, attrValue);
      }
    }
  }

  // Remove any extra attributes found on the original DOM element that
  // weren't found on the target element.
  const fromNodeAttrs = fromNode.attributes;

  for (var d = fromNodeAttrs.length - 1; d >= 0; d--) {
    const attr = fromNodeAttrs[d];
    let attrName = attr.name;
    const attrNamespaceURI = attr.namespaceURI;

    if (attrNamespaceURI) {
      attrName = attr.localName || attrName;

      if (!toNode.hasAttributeNS(attrNamespaceURI, attrName)) {
        fromNode.removeAttributeNS(attrNamespaceURI, attrName);
      }
    } else {
      if (!toNode.hasAttribute(attrName)) {
        fromNode.removeAttribute(attrName);
      }
    }
  }
}
