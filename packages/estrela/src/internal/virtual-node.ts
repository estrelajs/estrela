import {
  createEventEmitter,
  createState,
  EventEmitter,
  isCompletable,
  isNextable,
  State,
  Subscription,
} from '../observables';
import { Key } from '../types/types';
import { coerceArray, isFalsy } from '../utils';
import { effect } from './effect';
import {
  coerceNode,
  insertChild,
  mapNodeTree,
  patchChildren,
} from './node-api';

export type NodeInsertion = [any, number | null];

export interface NodeData {
  [key: string]: any;
  children?: NodeInsertion[];
}

type ProxyTarget = Record<
  string | number | symbol,
  State<any> | EventEmitter<any>
>;

export class VirtualNode {
  root: Node | null = null;
  props: Record<string, any> = {};

  private cleanup = new Subscription();

  get nextSibling(): Node | null {
    return this.root?.nextSibling ?? null;
  }

  constructor(
    readonly template: Node | ((props?: any) => VirtualNode),
    public data: any = {}
  ) {}

  mount(parent: Node, before: Node | null = null): Node {
    // is Component
    if (typeof this.template === 'function') {
      this.props = this.createProps(this.data);
      const template = this.template(this.props);
      return (this.root = template.mount(parent, before));
    }

    // is Node
    this.root = this.template.cloneNode(true);
    const tree = mapNodeTree(this.root);

    for (let key in this.data) {
      const node = tree[Number(key)];
      const data = this.data[key];
      this.handleNode(tree, node, data);
    }

    insertChild(parent, this.root, before);
    delete this.data;
    return this.root;
  }

  patchProps(props: any) {
    if (typeof this.template === 'function') {
      for (let key in props) {
        if (!key.startsWith('on:') && this.props[key] !== props[key]) {
          this.props.$[key].next(props[key]);
        }
      }
    }
  }

  unmount(parent: Node) {
    if (this.root) {
      parent.removeChild(this.root);
      this.root = null;
    }

    for (let key in this.props) {
      const prop = this.props[key];
      if (isCompletable(prop)) {
        prop.complete();
      }
    }

    this.cleanup.unsubscribe();
  }

  private createProps(data: any) {
    const getProxyState = (target: ProxyTarget, prop: string) => {
      if (prop in target) {
        return target[prop];
      }
      let state: State<any> | EventEmitter<any>;
      if (data.hasOwnProperty(`on:${prop}`)) {
        state = createEventEmitter();
        this.cleanup.add(
          state.subscribe(e => {
            const handler = data[`on:${prop}`];
            if (isNextable(handler)) {
              handler.next(e);
            } else if (typeof handler === 'function') {
              handler(e);
            }
          })
        );
      } else {
        state = createState(data[prop]);
      }
      target[prop] = state;
      return state;
    };

    return new Proxy({} as ProxyTarget, {
      get(target, prop) {
        if (prop === '$') {
          return new Proxy(
            {},
            { get: (_, prop) => getProxyState(target, String(prop)) }
          );
        }
        const state = getProxyState(target, String(prop));
        return state instanceof State ? state.$ : state;
      },
      set(target, prop, value) {
        if (prop === '$') {
          return false;
        }
        const state = getProxyState(target, String(prop));
        state.next(value);
        return true;
      },
    }) as any;
  }

  private handleNode(tree: Record<Key, Node>, node: Node, data: any) {
    for (let key in data) {
      if (key === 'children') {
        data.children.forEach(([data, path]: NodeInsertion) => {
          const before = tree[path ?? -1] ?? null;
          this.insert(node, data, before);
        });
      } else if (key.startsWith('on:')) {
        const eventName = key.substring(3);
        node.addEventListener(eventName, data[key]);
        this.cleanup.add(() => node.removeEventListener(eventName, data[key]));
      } else {
        this.setAttribute(node, key, data[key]);
      }
    }
  }

  private insert(parent: Node, data: any, before: Node | null) {
    let nodes: (Node | VirtualNode)[];

    if (typeof data === 'function') {
      let lastValue = {} as { value?: any };
      const subscription = effect<JSX.Children>(data).subscribe(value => {
        if (!lastValue.hasOwnProperty('value') || lastValue.value !== value) {
          lastValue = { value };
          const nextNodes = coerceArray(value).flat().map(coerceNode);
          if (nodes) {
            nodes = patchChildren(parent, nodes, nextNodes);
          } else {
            nodes = nextNodes;
          }
        }
      });
      this.cleanup.add(subscription);
      // @ts-expect-error
      if (!nodes || nodes.length === 0) {
        nodes = [document.createComment('')];
      }
    } else {
      nodes = coerceArray(data).flat().map(coerceNode);
    }

    nodes.forEach(node => insertChild(parent, node, before));
  }

  private setAttribute(node: Node, key: string, data: any) {
    const element = node as Element;
    if (!element.setAttribute) {
      return;
    }
    const setAttribute = (value: any) => {
      if (isFalsy(value)) {
        element.removeAttribute(key);
      } else if (value === true) {
        element.setAttribute(key, '');
      } else {
        element.setAttribute(key, value);
      }
    };
    if (typeof data === 'function') {
      let lastValue = {} as { value?: any };
      const subscription = effect(data).subscribe(value => {
        if (!lastValue.hasOwnProperty('value') || lastValue.value !== value) {
          lastValue = { value };
          setAttribute(value);
        }
      });
      this.cleanup.add(subscription);
    } else {
      setAttribute(data);
    }
  }
}

export function h(
  template: Node | ((props?: any) => VirtualNode),
  data: any
): VirtualNode {
  return new VirtualNode(template, data);
}
