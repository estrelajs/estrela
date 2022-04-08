import { VComponent, VFragment, VNode, VText } from './vnode';

export function isVComponent(x: any): x is VComponent {
  return typeof x?.Component === 'function';
}

export function isVFragment(x: any): x is VFragment {
  return x?.type === 'fragment';
}

export function isVNode(x: any): x is VNode {
  return typeof x?.type === 'string';
}

export function isVText(x: any): x is VText {
  return x?.type === 'text';
}
