import {
  createEventEmitter,
  createState,
  EventEmitter,
  isCompletable,
  isNextable,
  State,
  Subscription,
} from '../observables';
import { ProxyState } from '../proxy-state';
import { Key } from '../types/types';
import { coerceArray, isFalsy } from '../utils';
import { effect } from './effect';
import {
  coerceNode,
  insertChild,
  mapNodeTree,
  patchChildren,
  removeChild,
} from './node-api';

type NodeInsertion = [JSX.Children, number | null];

type ProxyTarget = Record<Key, State<any> | EventEmitter<any>>;

export interface NodeData {
  [key: Key]: any;
  children?: NodeInsertion[];
}

export class VirtualNode {
  root: Node | null = null;

  private cleanup = new Subscription();
  private props: ProxyState<NodeData> = {} as any;

  get isComponent(): boolean {
    return typeof this.template === 'function';
  }

  get nextSibling(): Node | null {
    return this.root?.nextSibling ?? null;
  }

  constructor(
    readonly template: Node | ((props?: any) => VirtualNode),
    public data?: NodeData
  ) {}

  mount(parent: Node, before: Node | null = null): Node {
    this.props = this.createProps(this.data ?? {});

    // is Component
    if (typeof this.template === 'function') {
      const template = this.template(this.props);
      this.root = template.mount(parent, before);
      return this.root;
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

  patch(data: NodeData) {
    if (!this.isComponent) {
      data = this.normalizeData(data);
    }
    for (let key in data) {
      const value = data[key];
      if (
        !key.startsWith('on:') &&
        typeof value !== 'function' &&
        this.props[key] !== value
      ) {
        this.props.$[key].next(value);
      }
    }
  }

  unmount(parent: Node) {
    for (let key in this.props) {
      const prop = this.props[key];
      if (isCompletable(prop)) {
        prop.complete();
      }
    }
    if (this.root) {
      removeChild(parent, this.root);
    }
    this.cleanup.unsubscribe();
    this.data = {};
    this.props = {} as any;
    this.root = null;
  }

  private createProps(data: NodeData): ProxyState<NodeData> {
    if (!this.isComponent) {
      data = this.normalizeData(data);
    }

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
        const value = data[prop];
        state = createState(data[prop]);
        if (typeof value === 'function') {
          this.cleanup.add(effect(value).subscribe(state));
        }
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
    }) as ProxyState<NodeData>;
  }

  private handleNode(tree: Record<Key, Node>, node: Node, data: any): void {
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

  private insert(parent: Node, data: any, before: Node | null): void {
    let nodes: (Node | VirtualNode)[];

    if (typeof data === 'function') {
      let lastValue = {} as { value?: any };
      const subscription = effect<JSX.Children>(data).subscribe(value => {
        if (!lastValue.hasOwnProperty('value') || lastValue.value !== value) {
          lastValue = { value };
          const nextNodes = coerceArray(value).flat().map(coerceNode);
          if (nextNodes.length === 0) {
            nextNodes.push(document.createComment(''));
          }
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

  private normalizeData(data: NodeData): NodeData {
    const result: NodeData = {};
    for (let key in data) {
      const props = data[key];
      for (let prop in props) {
        if (prop.startsWith('on:') || typeof props[prop] === 'function') {
          continue;
        }
        if (prop === 'children') {
          for (let i = 0; i < props.children.length; i++) {
            if (typeof props.children[i][0] === 'function') {
              continue;
            }
            const name = `${key}:${prop}:${i}`;
            result[name] = props.children[i][0];
            props.children[i][0] = () => this.props[name];
          }
        } else {
          const name = `${key}:${prop}`;
          result[name] = props[prop];
          props[prop] = () => this.props[name];
        }
      }
    }
    return result;
  }

  private setAttribute(node: Node, key: string, data: any): void {
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
  data: NodeData
): VirtualNode {
  return new VirtualNode(template, data);
}
