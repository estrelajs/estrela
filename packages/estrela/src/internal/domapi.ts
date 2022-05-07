export const domApi = {
  isElement(node: Node): node is Element {
    return node.nodeType === 1;
  },
  isHTMLElement(node: Node): node is HTMLElement {
    return domApi.isElement(node) && (node as any).style;
  },
  isText(node: Node): node is Text {
    return node.nodeType === 3;
  },
  isComment(node: Node): node is Comment {
    return node.nodeType === 8;
  },
  isDocumentFragment(node: Node): node is DocumentFragment {
    return node.nodeType === 11;
  },
  setTextContent(node: Node, text: string | null): void {
    node.textContent = text;
  },
};
