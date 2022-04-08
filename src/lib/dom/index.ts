export * from './html';
export * from './render';

/**
 * Hook node prototype
 */
Node.prototype.appendChild = ((
  appendChild: typeof Node.prototype.appendChild
) =>
  function <T extends Node>(this: Node, node: T) {
    if (node instanceof DocumentFragment) {
      (node as any).stepfather = this;
    }
    return appendChild.call(this, node) as T;
  })(Node.prototype.appendChild);

Node.prototype.insertBefore = ((
  insertBefore: typeof Node.prototype.insertBefore
) =>
  function <T extends Node>(this: Node, node: T, child: Node) {
    if (node instanceof DocumentFragment) {
      (node as any).stepfather = this;
    }
    return insertBefore.call(this, node, child) as T;
  })(Node.prototype.insertBefore);

Node.prototype.replaceChild = ((
  replaceChild: typeof Node.prototype.replaceChild
) =>
  function <T extends Node>(this: Node, node: Node, child: T) {
    if (node instanceof DocumentFragment) {
      (node as any).stepfather = this;
    }
    return replaceChild.call(this, node, child) as T;
  })(Node.prototype.replaceChild);
