import { State } from '../observables';
import { NodeData } from './types';

export const NODE_DATA_MAP = new WeakMap<Node, NodeData>();
export const STATE_CALLS = new Set<State<any>>();
