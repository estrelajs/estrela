export * from './html';
export * from './render';

/**
 * Experimental
 */

Node.prototype.appendChild = ((
  appendChild: typeof Node.prototype.appendChild
) =>
  function <T extends Node>(this: Node, node: T) {
    if (node instanceof DocumentFragment) {
      (node as any)._parent = this;
    }
    return appendChild.call(this, node) as T;
  })(Node.prototype.appendChild);

Node.prototype.replaceChild = ((
  replaceChild: typeof Node.prototype.replaceChild
) =>
  function <T extends Node>(this: Node, node: Node, child: T) {
    if (node instanceof DocumentFragment) {
      (node as any)._parent = this;
    }
    return replaceChild.call(this, node, child) as T;
  })(Node.prototype.replaceChild);
