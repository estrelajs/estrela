import { isNil } from '../utils';
import { NODE_DATA_MAP } from './node-map';

export enum MoveType {
  Remove,
  Insert,
}

export interface Move {
  type: MoveType;
  index: number;
  item: Node;
  replaced?: Node;
  ignore?: boolean;
}

/** Diff two list in O(N). */
export function diffNodes(oldList: Node[], newList: Node[]) {
  const oldMap = makeKeyIndexAndFree(oldList);
  const newMap = makeKeyIndexAndFree(newList);
  const newFree = newMap.free;

  const oldKeyIndex = oldMap.keyIndex;
  const newKeyIndex = newMap.keyIndex;

  const moves: Move[] = [];
  const children: (Node | null)[] = [];
  let freeIndex = 0;

  // first pass to check item in old list: if it's removed or not
  for (const item of oldList) {
    const key = getKey(item);
    if (!isNil(key)) {
      if (!newKeyIndex.hasOwnProperty(key)) {
        children.push(null);
      } else {
        const newItemIndex = newKeyIndex[key];
        children.push(newList[newItemIndex]);
      }
    } else {
      const freeItem = newFree[freeIndex++];
      children.push(freeItem ?? null);
    }
  }

  const simulateList = children.slice(0);

  // remove items no longer exist
  let i = 0;
  let j = 0;
  while (i < simulateList.length) {
    if (simulateList[i] === null) {
      remove(i, oldList[j]);
      removeSimulate(i);
    } else {
      i++;
    }
    j++;
  }

  // i is cursor pointing to a item in new list
  // j is cursor pointing to a item in simulateList
  j = i = 0;
  while (i < newList.length) {
    const item = newList[i];
    const itemKey = getKey(item);

    const simulateItem = simulateList[j];
    const simulateItemKey = getKey(simulateItem);

    if (simulateItem) {
      if (itemKey === simulateItemKey) {
        j++;
      } else {
        // new item, just insert it
        if (!oldKeyIndex.hasOwnProperty(itemKey!)) {
          insert(i, item);
        } else {
          insert(i, oldList[oldKeyIndex[itemKey!]]);
          j++;
        }
      }
    } else {
      insert(i, item);
    }
    i++;
  }

  //if j is not remove to the end, remove all the rest item
  let k = simulateList.length - j;
  while (j++ < simulateList.length) {
    k--;
    remove(k + i, simulateList[k + i] as Node);
  }

  function remove(index: number, item: Node) {
    const move: Move = { type: MoveType.Remove, index, item };
    moves.push(move);
  }

  function insert(index: number, item: Node) {
    const move: Move = { type: MoveType.Insert, index, item };
    moves.push(move);
  }

  function removeSimulate(index: number) {
    simulateList.splice(index, 1);
  }

  return {
    moves: moves,
    children: children as Node[],
  };
}

/**
 * Convert list to key-item keyIndex object.
 */
function makeKeyIndexAndFree(list: Node[]) {
  const keyIndex: Record<string | number | symbol, number> = {};
  const free: Node[] = [];
  for (let i = 0; i < list.length; i++) {
    const item = list[i];
    const itemKey = getKey(item);
    if (!isNil(itemKey) && !keyIndex.hasOwnProperty(itemKey)) {
      keyIndex[itemKey] = i;
    } else {
      free.push(item);
    }
  }
  return {
    keyIndex: keyIndex,
    free: free,
  };
}

function getKey(node?: Node | null) {
  return node ? NODE_DATA_MAP.get(node)?.key : undefined;
}
