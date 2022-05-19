import { hooks } from './internal/hooks';
import { getCurrentNodeData } from './internal/tools/node-data-store';
import { coerceArray } from './utils';

export function render(nodes: JSX.Element, parent: Element): void {
  new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(callInsertHook);
      mutation.removedNodes.forEach(callRemoveHook);
    });
  }).observe(parent, { childList: true, subtree: true });
  coerceArray(nodes).forEach(child => parent.appendChild(child));
}

function callInsertHook(node: Node): void {
  Array.from(node.childNodes).forEach(callInsertHook);
  const data = getCurrentNodeData(node);
  hooks.forEach(hook => hook.insert?.(node, { next: data }));
}

function callRemoveHook(node: Node): void {
  Array.from(node.childNodes).forEach(callRemoveHook);
  const data = getCurrentNodeData(node);
  hooks.forEach(hook => hook.remove?.(node, { prev: data }));
}
