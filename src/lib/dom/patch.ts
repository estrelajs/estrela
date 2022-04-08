import { buildNode } from './builders/node-builder';
import { isVComponent, isVFragment, isVNode, isVText, VNode } from './vnode';

export function patch(oldNode: VNode | Node, newNode: VNode): void {
  if (!isVNode(oldNode)) {
    oldNode.appendChild(buildNode(newNode));
    return;
  }

  if (oldNode.type !== newNode.type) {
    replaceNode(oldNode, newNode);
    return;
  }

  // copy node data
  newNode.node = oldNode.node;

  if (isVText(oldNode) && isVText(newNode)) {
    if (oldNode.content !== newNode.content && newNode.node) {
      newNode.node.textContent = newNode.content;
    }
    return;
  }

  if (isVComponent(oldNode) && isVComponent(newNode)) {
    const ref = oldNode.ref;
    if (ref) {
      ref.patchProps(newNode.data.props ?? {});
      ref.patchChildren(newNode.children);
      newNode.ref = ref;
    }
  }

  walkChildren(oldNode, newNode);
}

function walkChildren(oldNode: VNode, newNode: VNode): void {
  // remove VText types
  if (isVText(oldNode) || isVText(newNode)) {
    return;
  }

  const childrenCount = Math.max(
    oldNode.children.length,
    newNode.children.length
  );

  for (let i = 0; i < childrenCount; i++) {
    const oldChild = oldNode.children.at(i);
    const newChild = newNode.children.at(i);

    if (oldChild && newChild) {
      patch(oldChild, newChild);
    } else {
      if (oldChild) {
        removeNode(oldChild);
      }
      if (newChild) {
        insertNode(newChild, oldNode, i);
      }
    }
  }
}

function insertNode(newNode: VNode, parentVNode: VNode, index?: number): void {
  const parent = parentVNode.getNode();
  newNode.node = buildNode(newNode);

  if (parent) {
    if (index === undefined) {
      parent.appendChild(newNode.node);
    } else {
      parent.insertBefore(newNode.node, parent.childNodes[index]);
    }
  }
}

function removeNode(oldNode: VNode): void {
  if (oldNode.node?.parentNode) {
    oldNode.node.parentNode.removeChild(oldNode.node);
  }
}

function replaceNode(oldNode: VNode, newNode: VNode): void {
  if (!oldNode.node) {
    return;
  }
  const parent = oldNode.getParent();

  // when is fragment
  if (isVFragment(oldNode)) {
    const firstChild = oldNode.children[0]?.node;
    if (parent && firstChild) {
      const index = Array.from(parent.childNodes).indexOf(firstChild as any);
      oldNode.children.forEach(child => removeNode(child));
      insertNode(newNode, oldNode, index);
    } else {
      insertNode(newNode, oldNode);
    }
  } else {
    newNode.node = buildNode(newNode);
    if (oldNode.node && parent) {
      parent.replaceChild(newNode.node, oldNode.node);
    }
  }
}
