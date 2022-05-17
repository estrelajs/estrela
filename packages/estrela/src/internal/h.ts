import { Component } from '../types';
import { coerceArray } from '../utils';
import { createComponent } from './component';
import { domApi } from './domapi';
import { hooks } from './hooks';
import { NODE_DATA_MAP } from './tokens';
import { buildData } from './virtual-dom/data-builder';

interface Data {
  [key: string]: any;
  children?: any;
}

export function h(
  kind: string | Component | null,
  data: Data
): JSX.Element | null {
  const children = coerceArray(data.children ?? []);
  let element: Node;

  if (kind === '#') {
    kind = '#text';
  }
  if (kind === '!') {
    kind = '#comment';
  }
  if (kind === '#text') {
    element = document.createTextNode(children[0] ?? '');
  } else if (kind === '#comment') {
    element = document.createComment(children[0] ?? '');
  } else if (typeof kind === 'string') {
    element = document.createElement(kind);
  } else if (typeof kind === 'function') {
    const nodeData = buildData(data, true);
    return createComponent(kind, nodeData);
  } else {
    return children.flatMap(domApi.createElement);
  }

  const nodeData = buildData(data, false);
  NODE_DATA_MAP.set(element, nodeData);
  hooks.forEach(hook => hook.create?.(element, nodeData));
  children
    .flatMap(domApi.createElement)
    .forEach(child => element.appendChild(child));

  return element;
}
