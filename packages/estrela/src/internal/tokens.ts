import { State } from '../observables';
import { NodeData } from '../types/node-data';

export const NODE_DATA_MAP = new WeakMap<Node, NodeData>();
export const STATE_CALLS = new Set<State<any>>();

export function getNodeData(node?: Node): NodeData | undefined {
  return node ? NODE_DATA_MAP.get(node) : undefined;
}

export function setNodeData(node: Node, data: NodeData): void {
  NODE_DATA_MAP.set(node, data);
}
