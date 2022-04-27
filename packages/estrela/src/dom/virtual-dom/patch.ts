import { hooks } from '../hooks';
import { VirtualNode } from '../virtual-node';
import { diffChildren, MoveType } from './diff-children';
import { nodeApi } from './node-api';

export function patch(oldNode: VirtualNode, node: VirtualNode): VirtualNode {
  if (!oldNode.element) {
    throw new Error('Cannot patch a node without an element');
  }

  if (nodeApi.isSame(oldNode, node)) {
    node.element = oldNode.element;
    hooks.forEach(hook => hook.update?.(oldNode, node));

    if (oldNode.sel === '#text' || oldNode.sel === '#comment') {
      if (oldNode.text !== node.text) {
        nodeApi.setTextContent(oldNode.element, node.text ?? '');
      }
    } else if (oldNode.children || node.children) {
      patchChildren(oldNode, node);
    }
  } else {
    nodeApi.replaceElement(oldNode, node);
  }

  return node;
}

export function patchChildren(oldNode: VirtualNode, node: VirtualNode): void {
  const oldChildren = oldNode.children ?? [];
  const children = node.children ?? [];
  const meta = nodeApi.getMetadata(oldNode);
  const diff = diffChildren(oldChildren, children);

  for (let i = 0; i < oldChildren.length; i++) {
    const child = oldChildren[i];
    const newChild = diff.children[i];
    if (child && newChild) {
      patch(child, newChild);
    }
  }

  diff.moves.forEach(move => {
    if (move.type === MoveType.Remove) {
      nodeApi.removeElement(move.item);
    }
    if (move.type === MoveType.Insert) {
      let parent = meta.element;
      if (meta.isFragment) {
        parent = meta.parent ?? meta.element;
        move.index += meta.childIndex;
      }
      if (parent) {
        nodeApi.insertAtIndex(parent, move.item, move.index);
      }
    }
  });
}
