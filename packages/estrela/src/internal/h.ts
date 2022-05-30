import { Observable, tryParseObservable } from '../observables';
import { Component } from '../types/types';
import { coerceArray } from '../utils';
import { ComponentNode } from './component-node';
import { nodeHooks } from './hooks';
import { nodeApi } from './node-api';
import { PROPS_SYMBOL } from './symbols';

interface JsxProps {
  [key: string]: any;
  children?: any;
}

export function h(
  kind: string | Component,
  props: JsxProps = {},
  key?: string
): JSX.Element {
  if (typeof kind === 'function') {
    return new ComponentNode(kind, props);
  }
  if (kind === '#' || kind === '#text') {
    return document.createTextNode(String(props.children ?? ''));
  }
  if (kind === '!' || kind === '#comment') {
    return document.createComment(String(props.children ?? ''));
  }

  const node = document.createElement(kind);
  Reflect.defineMetadata(PROPS_SYMBOL, props, node);
  nodeHooks.forEach(hook => hook.create?.(node));

  coerceArray(props.children ?? []).forEach(child => {
    try {
      const observable = tryParseObservable(child);
      child = createObservableNode(node, observable);
    } catch {}
    coerceArray(child).forEach(child => {
      nodeApi.appendChild(node, coerceChild(child));
    });
  });

  return node;
}

function coerceChild(child: any): JSX.Element {
  return child instanceof Node || child instanceof ComponentNode
    ? child
    : h('#', { children: child });
}

function createObservableNode(
  parent: Node,
  obj: Observable<any>
): JSX.Element[] {
  let nodes: JSX.Element[] = [];
  const subscription = obj.subscribe(
    value => {
      const nextNodes = coerceArray(value).flat().map(coerceChild);
      if (nextNodes.length === 0) {
        nextNodes.push(h('#'));
      }
      if (nodes.length === 0) {
        nodes = nextNodes;
      } else {
        nodes = patchChildren(parent, nodes, nextNodes);
      }
    },
    { initialEmit: true }
  );
  if (nodes.length === 0) {
    nodes = [h('#')];
  }
  return nodes;
}

function patchChildren(
  parent: Node,
  children: JSX.Element[],
  nextChildren: JSX.Element[]
): JSX.Element[] {
  const result: JSX.Element[] = [];
  const currentLength = children.length;
  const nextLength = nextChildren.length;

  for (let i = 0; i < nextLength; i++) {
    if (i < currentLength) {
      const node = patchNode(parent, children[i], nextChildren[i]);
      result.push(node);
    } else {
      nodeApi.insertAfter(parent, nextChildren[i], result.at(-1) ?? null);
      result.push(nextChildren[i]);
    }
  }
  for (let i = currentLength - 1; i >= nextLength; i--) {
    nodeApi.removeChild(parent, children[i]);
  }
  return result;
}

function patchNode(
  parent: Node,
  node: JSX.Element,
  nextNode: JSX.Element
): JSX.Element {
  if (nodeApi.isSame(node, nextNode)) {
    if (node instanceof ComponentNode) {
      node.patch((nextNode as ComponentNode).data);
      return node;
    }
    nextNode = nextNode as Node;
    if (nodeApi.isTextElement(node)) {
      if (node.textContent !== nextNode.textContent) {
        node.textContent = nextNode.textContent;
      }
    } else {
      const children = Array.from(node.childNodes);
      const nextChildren = Array.from(nextNode.childNodes);
      patchChildren(parent, children, nextChildren);
    }
    return node;
  }
  nodeApi.replaceChild(parent, nextNode, node);
  return nextNode;
}
