import { VirtualNode } from '../virtual-dom/virtual-node';

export interface Hook {
  create?: (emptyNode: VirtualNode, newNode: VirtualNode) => void;
  update?: (oldNode: VirtualNode, newNode: VirtualNode) => void;
  remove?: (oldNode: VirtualNode) => void;
}
