import { VirtualNode } from '../virtual-node';

interface WalkOptions {
  on: 'enter' | 'exit';
}

export function walk(
  node: VirtualNode,
  cb: (node: VirtualNode) => void,
  opts?: WalkOptions
): void {
  const { on = 'exit' } = opts || {};
  if (on === 'enter') {
    cb(node);
  }
  if (node.children) {
    for (const child of node.children) {
      walk(child, cb);
    }
  }
  if (on === 'exit') {
    cb(node);
  }
}
