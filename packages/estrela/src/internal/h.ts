import { Component } from '../types/jsx';
import { coerceArray } from '../utils';
import { createComponent } from './component';
import { buildData } from './data-builder';
import { domApi } from './domapi';
import { hooks } from './hooks';
import { setNodeData } from './tokens';

interface Data {
  [key: string]: any;
  children?: any;
}

export function h(
  kind: string | Component | null,
  data: Data
): JSX.Element | null {
  const children = coerceArray(data.children ?? []);
  let node: Node;

  if (kind === '#') {
    kind = '#text';
  }
  if (kind === '!') {
    kind = '#comment';
  }
  if (kind === '#text') {
    node = document.createTextNode(children[0] ?? '');
  } else if (kind === '#comment') {
    node = document.createComment(children[0] ?? '');
  } else if (typeof kind === 'string') {
    node = document.createElement(kind);
  } else if (typeof kind === 'function') {
    const nodeData = buildData(data, true);
    return createComponent(kind, nodeData);
  } else {
    return children.flatMap(domApi.createElement);
  }

  const nodeData = buildData(data, false);
  hooks.forEach(hook => hook.create?.(node, nodeData));
  setNodeData(node, nodeData);

  children
    .flatMap(domApi.createElement)
    .forEach(child => node.appendChild(child));

  return node;
}
