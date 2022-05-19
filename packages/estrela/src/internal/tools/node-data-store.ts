import { NodeData } from '../../types/node-data';

const NODE_DATA_STORE = new WeakMap<
  Node,
  { original: NodeData; current: NodeData }
>();

export function getCurrentNodeData(node: Node) {
  return NODE_DATA_STORE.get(node)?.current ?? {};
}

export function getOriginalNodeData(node: Node) {
  return NODE_DATA_STORE.get(node)?.original ?? {};
}

export function setCurrentNodeData(node: Node, data: NodeData) {
  const store = NODE_DATA_STORE.get(node);
  if (store) {
    store.current = data;
  } else {
    NODE_DATA_STORE.set(node, { original: data, current: data });
  }
}
