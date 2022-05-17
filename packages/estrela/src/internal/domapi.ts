import {
  coerceObservable,
  createSelector,
  isPromise,
  isSubscribable,
  Subscribable,
} from '../observables';
import { diffNodes, MoveType } from './diff-nodes';
import { hooks } from './hooks';
import { NODE_DATA_MAP } from './tokens';

export const domApi = {
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
        nodes = patchNodes(nodes, value);
      },
      { initialEmit: true }
    );
    return nodes;
  },

  isElement(node: Node): node is Element {
    return node.nodeType === 1;
  },

  isHTMLElement(node: Node): node is HTMLElement {
    return domApi.isElement(node) && (node as any).style;
  },

  isComment(node: Node): node is Comment {
    return node.nodeType === 8;
  },

  isFragment(node: Node): node is DocumentFragment {
    return node.nodeType === 11;
  },

  isText(node: Node): node is Text {
    return node.nodeType === 3;
  },

  setTextContent(node: Node, text: string | null): void {
    node.textContent = text;
  },
};

function patchNodes(nodes: Node[], data: any): Node[] {
  const firstChild = nodes[0];
  const parent = firstChild?.parentElement;
  const newNodes = [domApi.createElement(data)].flat();

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

  return newNodes;
}

function patchNode(node: Node, newNode: Node): Node {
  if (node.nodeType === newNode.nodeType) {
    const nodeData = NODE_DATA_MAP.get(node) ?? {};
    hooks.forEach(hook => hook.update?.(node, nodeData));
    if (domApi.isText(node) || domApi.isComment(node)) {
      if (node.textContent !== newNode.textContent) {
        node.textContent = newNode.textContent;
      }
    } else {
      patchNodes(Array.from(node.childNodes), Array.from(newNode.childNodes));
    }
    return node;
  }
  node.parentNode?.replaceChild(newNode, node);
  return newNode;
}
