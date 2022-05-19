import { NodeData } from '../../types/node-data';

export interface HookData {
  prev?: NodeData;
  next?: NodeData;
}

export interface Hook {
  create?: (node: Node, data: HookData) => void;
  insert?: (node: Node, data: HookData) => void;
  update?: (node: Node, data: HookData) => void;
  remove?: (node: Node, data: HookData) => void;
}
