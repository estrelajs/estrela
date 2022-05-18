import { NodeData } from '../../types/node-data';

export interface Hook {
  create?: (node: Node, data: NodeData) => void;
  insert?: (node: Node, data: NodeData) => void;
  update?: (node: Node, data: NodeData) => void;
  remove?: (node: Node, data: NodeData) => void;
}
