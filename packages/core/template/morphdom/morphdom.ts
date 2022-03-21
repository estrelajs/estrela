import { morphAttrs } from './morph-attrs';
import { MorphDomOptions } from './types';
import {
  compareNodeNames,
  toElement,
  moveChildren,
  createElementNS,
  doc as document,
} from './util';

const ELEMENT_NODE = 1;
const DOCUMENT_FRAGMENT_NODE = 11;
const TEXT_NODE = 3;
const COMMENT_NODE = 8;
const doc = document!;

function noop() {}

function defaultGetNodeKey(node: Node): string | undefined {
  const _node = node as HTMLElement;
  if (_node) {
    return (_node.getAttribute && _node.getAttribute('id')) || _node.id;
  }
}

export function morphdom(
  fromNode: HTMLElement,
  toNode: HTMLElement | string,
  options?: MorphDomOptions
) {
  if (!options) {
    options = {};
  }

  if (typeof toNode === 'string') {
    if (
      fromNode.nodeName === '#document' ||
      fromNode.nodeName === 'HTML' ||
      fromNode.nodeName === 'BODY'
    ) {
      const toNodeHtml = toNode;
      toNode = doc.createElement('html');
      toNode.innerHTML = toNodeHtml;
    } else {
      toNode = toElement(toNode);
    }
  } else if (
    toNode.nodeType === DOCUMENT_FRAGMENT_NODE &&
    toNode.firstElementChild
  ) {
    toNode = toNode.firstElementChild as HTMLElement;
  }

  const getNodeKey = options.getNodeKey || defaultGetNodeKey;
  const onBeforeNodeAdded = options.onBeforeNodeAdded || noop;
  const onNodeAdded = options.onNodeAdded || noop;
  const onBeforeElUpdated = options.onBeforeElUpdated || noop;
  const onElUpdated = options.onElUpdated || noop;
  const onBeforeNodeDiscarded = options.onBeforeNodeDiscarded || noop;
  const onNodeDiscarded = options.onNodeDiscarded || noop;
  const onBeforeElChildrenUpdated = options.onBeforeElChildrenUpdated || noop;
  const childrenOnly = options.childrenOnly === true;

  // This object is used as a lookup to quickly find all keyed elements in the original DOM tree.
  const fromNodesLookup: Record<string, HTMLElement> = Object.create(null);
  const keyedRemovalList: string[] = [];

  function addKeyedRemoval(key: string) {
    keyedRemovalList.push(key);
  }

  function walkDiscardedChildNodes(node: Node, skipKeyedNodes: boolean) {
    if (node.nodeType === ELEMENT_NODE) {
      let curChild = node.firstChild as HTMLElement | null;
      while (curChild) {
        const key = getNodeKey(curChild);

        if (skipKeyedNodes && key) {
          // If we are skipping keyed nodes then we add the key
          // to a list so that it can be handled at the very end.
          addKeyedRemoval(key);
        } else {
          // Only report the node as discarded if it is not keyed. We do this because
          // at the end we loop through all keyed elements that were unmatched
          // and then discard them in one final pass.
          onNodeDiscarded(curChild);
          if (curChild.firstChild) {
            walkDiscardedChildNodes(curChild, skipKeyedNodes);
          }
        }

        curChild = curChild.nextSibling as HTMLElement | null;
      }
    }
  }

  /**
   * Removes a DOM node out of the original DOM
   *
   * @param node The node to remove
   * @param parentNode The nodes parent
   * @param skipKeyedNodes If true then elements with keys will be skipped and not discarded.
   */
  function removeNode(node: Node, parentNode: Node | null, skipKeyedNodes: boolean) {
    if (onBeforeNodeDiscarded(node) === false) {
      return;
    }

    if (parentNode) {
      parentNode.removeChild(node);
    }

    onNodeDiscarded(node);
    walkDiscardedChildNodes(node, skipKeyedNodes);
  }

  function indexTree(node: Node) {
    if (node.nodeType === ELEMENT_NODE || node.nodeType === DOCUMENT_FRAGMENT_NODE) {
      let curChild = node.firstChild as HTMLElement | null;
      while (curChild) {
        const key = getNodeKey(curChild);
        if (key) {
          fromNodesLookup[key] = curChild;
        }

        // Walk recursively
        indexTree(curChild);

        curChild = curChild.nextSibling as HTMLElement | null;
      }
    }
  }

  indexTree(fromNode);

  function handleNodeAdded(el: HTMLElement) {
    onNodeAdded(el);

    let curChild = el.firstChild as HTMLElement | null;
    while (curChild) {
      const nextSibling = curChild.nextSibling;

      const key = getNodeKey(curChild);
      if (key) {
        const unmatchedFromEl = fromNodesLookup[key];
        // if we find a duplicate #id node in cache, replace `el` with cache value
        // and morph it to the child node.
        if (unmatchedFromEl && compareNodeNames(curChild, unmatchedFromEl)) {
          curChild.parentNode?.replaceChild(unmatchedFromEl, curChild);
          morphEl(unmatchedFromEl, curChild);
        } else {
          handleNodeAdded(curChild);
        }
      } else {
        // recursively call for curChild and it's children to see if we find something in
        // fromNodesLookup
        handleNodeAdded(curChild);
      }

      curChild = nextSibling as HTMLElement | null;
    }
  }

  function cleanupFromEl(
    fromEl: HTMLElement,
    curFromNodeChild: HTMLElement | null,
    curFromNodeKey?: string
  ) {
    // We have processed all of the "to nodes". If curFromNodeChild is
    // non-null then we still have some from nodes left over that need
    // to be removed
    while (curFromNodeChild) {
      const fromNextSibling = curFromNodeChild.nextSibling as HTMLElement | null;
      if ((curFromNodeKey = getNodeKey(curFromNodeChild))) {
        // Since the node is keyed it might be matched up later so we defer
        // the actual removal to later
        addKeyedRemoval(curFromNodeKey);
      } else {
        // NOTE: we skip nested keyed nodes from being removed since there is
        //       still a chance they will be matched up later
        removeNode(curFromNodeChild, fromEl, true /* skip keyed nodes */);
      }
      curFromNodeChild = fromNextSibling;
    }
  }

  function morphEl(fromEl: HTMLElement, toEl: HTMLElement, childrenOnly?: boolean) {
    const toElKey = getNodeKey(toEl);

    if (toElKey) {
      // If an element with an ID is being morphed then it will be in the final
      // DOM so clear it out of the saved elements collection
      delete fromNodesLookup[toElKey];
    }

    if (!childrenOnly) {
      // optional
      if (onBeforeElUpdated(fromEl, toEl) === false) {
        return;
      }

      // update attributes on original DOM element first
      morphAttrs(fromEl, toEl);
      // optional
      onElUpdated(fromEl);

      if (onBeforeElChildrenUpdated(fromEl, toEl) === false) {
        return;
      }
    }

    morphChildren(fromEl, toEl);
  }

  function morphChildren(fromEl: HTMLElement, toEl: HTMLElement) {
    let curToNodeChild = toEl.firstChild as HTMLElement | null;
    let curFromNodeChild = fromEl.firstChild as HTMLElement | null;
    let fromNextSibling: HTMLElement | null;
    let matchingFromEl: HTMLElement | null;
    let curFromNodeKey: string | undefined;

    // walk the children
    outer: while (curToNodeChild) {
      const toNextSibling = curToNodeChild.nextSibling as HTMLElement | null;
      const curToNodeKey = getNodeKey(curToNodeChild);

      // walk the fromNode children all the way through
      while (curFromNodeChild) {
        fromNextSibling = curFromNodeChild.nextSibling as HTMLElement | null;

        if (
          curToNodeChild.isSameNode &&
          curToNodeChild.isSameNode(curFromNodeChild)
        ) {
          curToNodeChild = toNextSibling;
          curFromNodeChild = fromNextSibling;
          continue outer;
        }

        curFromNodeKey = getNodeKey(curFromNodeChild);

        const curFromNodeType = curFromNodeChild.nodeType;

        // this means if the curFromNodeChild doesnt have a match with the curToNodeChild
        let isCompatible: boolean | undefined = undefined;

        if (curFromNodeType === curToNodeChild.nodeType) {
          if (curFromNodeType === ELEMENT_NODE) {
            // Both nodes being compared are HTMLElement nodes

            if (curToNodeKey) {
              // The target node has a key so we want to match it up with the correct element
              // in the original DOM tree
              if (curToNodeKey !== curFromNodeKey) {
                // The current element in the original DOM tree does not have a matching key so
                // let's check our lookup to see if there is a matching element in the original
                // DOM tree
                if ((matchingFromEl = fromNodesLookup[curToNodeKey])) {
                  if (fromNextSibling === matchingFromEl) {
                    // Special case for single element removals. To avoid removing the original
                    // DOM node out of the tree (since that can break CSS transitions, etc.),
                    // we will instead discard the current node and wait until the next
                    // iteration to properly match up the keyed target element with its matching
                    // element in the original tree
                    isCompatible = false;
                  } else {
                    // We found a matching keyed element somewhere in the original DOM tree.
                    // Let's move the original DOM node into the current position and morph
                    // it.

                    // NOTE: We use insertBefore instead of replaceChild because we want to go through
                    // the `removeNode()` function for the node that is being discarded so that
                    // all lifecycle hooks are correctly invoked
                    fromEl.insertBefore(matchingFromEl, curFromNodeChild);

                    // fromNextSibling = curFromNodeChild.nextSibling;

                    if (curFromNodeKey) {
                      // Since the node is keyed it might be matched up later so we defer
                      // the actual removal to later
                      addKeyedRemoval(curFromNodeKey);
                    } else {
                      // NOTE: we skip nested keyed nodes from being removed since there is
                      //       still a chance they will be matched up later
                      removeNode(
                        curFromNodeChild,
                        fromEl,
                        true /* skip keyed nodes */
                      );
                    }

                    curFromNodeChild = matchingFromEl;
                  }
                } else {
                  // The nodes are not compatible since the "to" node has a key and there
                  // is no matching keyed node in the source tree
                  isCompatible = false;
                }
              }
            } else if (curFromNodeKey) {
              // The original has a key
              isCompatible = false;
            }

            isCompatible =
              isCompatible !== false &&
              compareNodeNames(curFromNodeChild, curToNodeChild);
            if (isCompatible) {
              // We found compatible DOM elements so transform
              // the current "from" node to match the current
              // target DOM node.
              // MORPH
              morphEl(curFromNodeChild, curToNodeChild);
            }
          } else if (
            curFromNodeType === TEXT_NODE ||
            curFromNodeType == COMMENT_NODE
          ) {
            // Both nodes being compared are Text or Comment nodes
            isCompatible = true;
            // Simply update nodeValue on the original node to
            // change the text value
            if (curFromNodeChild.nodeValue !== curToNodeChild.nodeValue) {
              curFromNodeChild.nodeValue = curToNodeChild.nodeValue;
            }
          }
        }

        if (isCompatible) {
          // Advance both the "to" child and the "from" child since we found a match
          // Nothing else to do as we already recursively called morphChildren above
          curToNodeChild = toNextSibling;
          curFromNodeChild = fromNextSibling;
          continue outer;
        }

        // No compatible match so remove the old node from the DOM and continue trying to find a
        // match in the original DOM. However, we only do this if the from node is not keyed
        // since it is possible that a keyed node might match up with a node somewhere else in the
        // target tree and we don't want to discard it just yet since it still might find a
        // home in the final DOM tree. After everything is done we will remove any keyed nodes
        // that didn't find a home
        if (curFromNodeKey) {
          // Since the node is keyed it might be matched up later so we defer
          // the actual removal to later
          addKeyedRemoval(curFromNodeKey);
        } else {
          // NOTE: we skip nested keyed nodes from being removed since there is
          //       still a chance they will be matched up later
          removeNode(curFromNodeChild, fromEl, true /* skip keyed nodes */);
        }

        curFromNodeChild = fromNextSibling;
      } // END: while(curFromNodeChild) {}

      // If we got this far then we did not find a candidate match for
      // our "to node" and we exhausted all of the children "from"
      // nodes. Therefore, we will just append the current "to" node
      // to the end
      if (
        curToNodeKey &&
        (matchingFromEl = fromNodesLookup[curToNodeKey]) &&
        compareNodeNames(matchingFromEl, curToNodeChild)
      ) {
        fromEl.appendChild(matchingFromEl);
        // MORPH
        morphEl(matchingFromEl, curToNodeChild);
      } else {
        const onBeforeNodeAddedResult = onBeforeNodeAdded(curToNodeChild);
        if (onBeforeNodeAddedResult !== false) {
          if (onBeforeNodeAddedResult) {
            curToNodeChild = onBeforeNodeAddedResult as HTMLElement;
          }

          if ((curToNodeChild as any).actualize) {
            curToNodeChild = (curToNodeChild as any).actualize(
              fromEl.ownerDocument || doc
            );
          }
          fromEl.appendChild(curToNodeChild as Node);
          handleNodeAdded(curToNodeChild!);
        }
      }

      curToNodeChild = toNextSibling;
      curFromNodeChild = fromNextSibling!;
    }

    cleanupFromEl(fromEl, curFromNodeChild, curFromNodeKey);
  } // END: morphChildren(...)

  let morphedNode = fromNode;
  const morphedNodeType = morphedNode.nodeType;
  const toNodeType = toNode.nodeType;

  if (!childrenOnly) {
    // Handle the case where we are given two DOM nodes that are not
    // compatible (e.g. <div> --> <span> or <div> --> TEXT)
    if (morphedNodeType === ELEMENT_NODE) {
      if (toNodeType === ELEMENT_NODE) {
        if (!compareNodeNames(fromNode, toNode)) {
          onNodeDiscarded(fromNode);
          morphedNode = moveChildren(
            fromNode,
            createElementNS(toNode.nodeName, toNode.namespaceURI)
          );
        }
      } else {
        // Going from an element node to a text node
        morphedNode = toNode;
      }
    } else if (morphedNodeType === TEXT_NODE || morphedNodeType === COMMENT_NODE) {
      // Text or comment node
      if (toNodeType === morphedNodeType) {
        if (morphedNode.nodeValue !== toNode.nodeValue) {
          morphedNode.nodeValue = toNode.nodeValue;
        }

        return morphedNode;
      } else {
        // Text node to something else
        morphedNode = toNode;
      }
    }
  }

  if (morphedNode === toNode) {
    // The "to node" was not compatible with the "from node" so we had to
    // toss out the "from node" and use the "to node"
    onNodeDiscarded(fromNode);
  } else {
    if (toNode.isSameNode && toNode.isSameNode(morphedNode)) {
      return;
    }

    morphEl(morphedNode, toNode, childrenOnly);

    // We now need to loop over any keyed nodes that might need to be
    // removed. We only do the removal if we know that the keyed node
    // never found a match. When a keyed node is matched up we remove
    // it out of fromNodesLookup and we use fromNodesLookup to determine
    // if a keyed node has been matched up or not
    if (keyedRemovalList) {
      for (let i = 0, len = keyedRemovalList.length; i < len; i++) {
        const elToRemove = fromNodesLookup[keyedRemovalList[i]];
        if (elToRemove) {
          removeNode(elToRemove, elToRemove.parentNode, false);
        }
      }
    }
  }

  if (!childrenOnly && morphedNode !== fromNode && fromNode.parentNode) {
    if ((morphedNode as any).actualize) {
      morphedNode = (morphedNode as any).actualize(fromNode.ownerDocument || doc);
    }
    // If we had to swap out the from node with a new node because the old
    // node was not compatible with the target node then we need to
    // replace the old DOM node in the original DOM tree. This is only
    // possible if the original DOM node was part of a DOM tree which
    // we know is the case if it has a parent node.
    fromNode.parentNode.replaceChild(morphedNode, fromNode);
  }

  return morphedNode;
}
