import { NodeData } from '../types';

export interface Hook {
  create?: (node: Node, data: NodeData) => void;
}
