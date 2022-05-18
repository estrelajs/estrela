import {
  createEventEmitter,
  createSelector,
  createState,
  EventEmitter,
  isEventEmitter,
  isState,
  State,
} from '../observables';
import { Component } from '../types/jsx';
import { ProxyState } from './proxy-state';
import { NodeData } from '../types/node-data';

type ProxyTarget = Record<
  string | number | symbol,
  State<any> | EventEmitter<any>
>;

export function createComponent(
  Component: Component,
  data: NodeData
): Node | Node[] | null {
  const props = createProps(data);
  const template = Component(props);
  return template;
}

function createProps(data: NodeData): ProxyState<any> {
  const getProxyState = (target: ProxyTarget, prop: string) => {
    if (target[prop]) {
      return target[prop];
    }
    let state: State<any> | EventEmitter<any>;
    if (data.events?.hasOwnProperty(prop)) {
      state = createEventEmitter();
      // const subscription = state.subscribe(e => {
      //   this.node.element!.dispatchEvent(
      //     new CustomEvent(String(prop), { detail: e })
      //   );
      // });
      // this.cleanup.add(subscription);
    } else {
      state = createState();
      const obj = data.props?.[prop];
      if (isState(obj)) {
        state = obj;
      } else if (typeof obj === 'function') {
        const selector = createSelector(obj);
        selector.subscribe(state);
      } else {
        state.next(obj);
      }
    }
    target[prop] = state;
    return state;
  };
  return new Proxy({} as ProxyTarget, {
    get(target, prop: string) {
      if (prop === '$') {
        return new Proxy(
          {},
          { get: (_, prop: string) => getProxyState(target, prop) }
        );
      }
      const state = getProxyState(target, prop);
      return isEventEmitter(state) ? state : state.$;
    },
    set(target, prop: string, value) {
      const state = getProxyState(target, prop);
      state.next(value);
      return true;
    },
  }) as any;
}

// function buildTemplate(template: JSX.Element, props: ProxyState<any>, data: NodeData): JSX.Element {
//   const visitor = (node: Node): Node | Node[] => {
//     if (node.nodeName.toLowerCase() === 'slot') {
//       const originalChildren = node.children;

//       fragment.observable = createSelector(props.$.children, () => {
//         const slot = data.attrs?.name as string | undefined;
//         const select = data.attrs?.select as string | undefined;
//         let content: VirtualNode[] = this.children;

//         if (select) {
//           content = this.children.filter(child => child.kind === select);
//         } else if (slot) {
//           content = this.children.filter(child => child.data?.slot === slot);
//         }

//         if (content.length === 0) {
//           return originalChildren;
//         }

//         return content;
//       });

//       return fragment;
//     }

//     // const styledComponent = this.node.kind as any;
//     // if (styledComponent.styleId) {
//     //   node.data ??= {};
//     //   node.data.attrs ??= {};
//     //   node.data.attrs[`_${styledComponent.styleId}`] = '';
//     // }

//     // if (node.children) {
//     //   node.children = node.children.map(visitor);
//     // }

//     return node;
//   };

//   return visitor(template);
// }
