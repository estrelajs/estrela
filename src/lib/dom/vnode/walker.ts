import { isVText } from './utils';
import { VNode } from './vnode';

export function vNodeWalker(vnode: VNode, cb: (vnode: VNode) => void): void {
  cb(vnode);
  if (!isVText(vnode)) {
    vnode.children.forEach(child => vNodeWalker(child, cb));
  }
}
