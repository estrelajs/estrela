import {
  coerceObservable,
  createSelector,
  createSubscription,
  isPromise,
  isSubscribable,
  Subscribable,
  Subscription,
} from '../observables';
import { hooks } from './hooks';
import { diffNodes, MoveType } from './tools/diff-nodes';
import {
  getCurrentNodeData,
  getOriginalNodeData,
  setCurrentNodeData,
} from './tools/node-data-store';

export const domApi = {
  addEventListener(
    node: Node,
    event: string,
    listener: EventListener
  ): Subscription {
    node.addEventListener(event, listener);
    return createSubscription(() => {
      node.removeEventListener(event, listener);
    });
  },

  cloneNode(node: Node): Node {
    const data = getOriginalNodeData(node);
    const clone = node.cloneNode(true);
    setCurrentNodeData(clone, data);
    return clone;
  },

  createElement(content: JSX.Children): Node | Node[] {
    if (content instanceof Node) {
      return content;
    }
    if (Array.isArray(content)) {
      return content.flatMap(domApi.createElement);
    }
    if (isPromise(content) || isSubscribable(content)) {
      return domApi.createObservableElement(content);
    }
    if (typeof content === 'function') {
      return domApi.createObservableElement(createSelector(content));
    }
    return document.createTextNode(String(content ?? ''));
  },

  createFragment(children: Node[]): DocumentFragment {
    const fragment = document.createDocumentFragment();
    children.forEach(child => fragment.appendChild(child));
    return fragment;
  },

  createObservableElement(obj: Promise<any> | Subscribable<any>): Node[] {
    let nodes: Node[] = [];
    const subscription = coerceObservable(obj).subscribe(
      value => {
        if (nodes[0]?.parentElement === null) {
          subscription.unsubscribe();
          return;
        }
        const newNodes = [domApi.createElement(value)].flat();
        nodes = patchNodes(nodes, newNodes);
      },
      { initialEmit: true }
    );
    if (nodes.length === 0) {
      nodes.push(document.createTextNode(''));
    }
    return nodes;
  },

  isComment(node: Node): node is Comment {
    return node.nodeType === 8;
  },

  isElement(node: Node): node is Element {
    return node.nodeType === 1;
  },

  isFragment(node: Node): node is DocumentFragment {
    return node.nodeType === 11;
  },

  isHTMLElement(node: Node): node is HTMLElement {
    return domApi.isElement(node) && (node as any).style;
  },

  isSameNode(node: Node, other: Node): boolean {
    return (
      node === other ||
      (node.nodeType === other.nodeType && node.nodeName === other.nodeName)
    );
  },

  isText(node: Node): node is Text {
    return node.nodeType === 3;
  },

  setTextContent(node: Node, text: string | null): void {
    node.textContent = text;
  },
};

function patchNodes(nodes: Node[], newNodes: Node[]): Node[] {
  const firstChild = nodes[0];
  const parent = firstChild?.parentElement;

  if (newNodes.length === 0) {
    newNodes.push(document.createTextNode(''));
  }

  if (parent) {
    const children = Array.from(parent.childNodes) as Node[];
    const startIndex = children.indexOf(firstChild);
    const diff = diffNodes(nodes, newNodes);

    for (let i = 0; i < nodes.length; i++) {
      const child = nodes[i];
      const newChild = diff.children[i];
      if (child && newChild) {
        patchNode(child, newChild);
      }
    }

    diff.moves.forEach(move => {
      if (move.type === MoveType.Remove) {
        parent.removeChild(move.item);
      }
      if (move.type === MoveType.Insert) {
        move.index += startIndex;
        const oldChild = parent.childNodes[move.index];
        parent.insertBefore(move.item, oldChild);
      }
    });

    return Array.from(parent.childNodes).slice(
      startIndex,
      startIndex + newNodes.length
    );
  }

  return newNodes.map(domApi.cloneNode);
}

function patchNode(node: Node, newNode: Node): Node {
  if (domApi.isSameNode(node, newNode)) {
    if (domApi.isText(node) || domApi.isComment(node)) {
      if (node.textContent !== newNode.textContent) {
        domApi.setTextContent(node, newNode.textContent);
      }
    } else {
      const nextData = getCurrentNodeData(newNode);
      patchNodes(Array.from(node.childNodes), Array.from(newNode.childNodes));
      hooks.forEach(hook =>
        hook.update?.(node, {
          prev: getCurrentNodeData(node),
          next: nextData,
        })
      );
      setCurrentNodeData(node, nextData);
    }
    return node;
  }
  newNode = domApi.cloneNode(newNode);
  node.parentNode?.replaceChild(newNode, node);
  return newNode;
}
