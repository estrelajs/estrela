import {
  createEventEmitter,
  createState,
  EventEmitter,
  isEventEmitter,
  isState,
  State,
  tryParseObservable,
} from '../observables';
import { ProxyState } from '../proxy-state';
import { coerceArray } from '../utils';
import { insert, mapNodeTree, patchChildren } from './node-api';

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
  tree: Record<any, Node> = {};

  get nextSibling(): Node | null {
    return this.root ? this.root.nextSibling : null;
  }

  constructor(
    readonly template: Node | ((props?: any) => VirtualNode),
    readonly data: any = {}
  ) {}

  mount(parent: Node, before: Node | null = null): Node {
    if (typeof this.template === 'function') {
      const template = this.template(this.createProps());
      this.root = template.mount(parent, before);
      return this.root;
    }
    this.root = this.template.cloneNode(true);
    this.tree = mapNodeTree(this.root);

    for (let i in this.data) {
      const node = this.tree[i];
      const data = this.data[i];
      this.handlerData(node, data);
    }

    return insert(parent, this.root, before);
  }

  unmount(parent: Node) {
    if (this.root) {
      parent.removeChild(this.root);
      this.root = null;
      this.tree = {};
    }
  }

  private createProps(): ProxyState<any> {
    const getProxyState = (target: ProxyTarget, prop: string) => {
      if (prop in target) {
        return target[prop];
      }
      let state: State<any> | EventEmitter<any>;
      if (this.data.hasOwnProperty(`on:${prop}`)) {
        state = createEventEmitter();
        // this.cleanup.add(
        state.subscribe(e => {
          const handler = this.data[`on:${prop}`];
          if (isState(handler) || isEventEmitter(handler)) {
            handler.next(e);
          } else if (typeof handler === 'function') {
            handler(e);
          }
        });
        // );
      } else {
        state = createState(this.data[prop]);
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
        return isState(state) ? state.$ : state;
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

  private handlerData(node: Node, data: any) {
    for (let key in data) {
      if (key === 'children') {
        data.children?.forEach((insertion: NodeInsertion) =>
          this.insert(node, insertion)
        );
      } else if (key.startsWith('on:')) {
        const eventName = key.substring(3);
        node.addEventListener(eventName, data[key]);
      } else {
        this.setAttribute(node, key, data[key]);
      }
    }
  }

  private insert(parent: Node, insertion: NodeInsertion) {
    const [data, beforeIndex] = insertion;
    const before = this.tree[beforeIndex ?? -1] ?? null;
    try {
      let nodes: VirtualNode[];
      const subscription = tryParseObservable(data).subscribe(
        value => {
          const nextNodes = VirtualNode.create(value);
          if (nodes) {
            nodes = patchChildren(parent, nodes, nextNodes);
          } else {
            nodes = nextNodes;
            nextNodes.forEach(n => n.mount(parent, before));
          }
        },
        { initialEmit: true }
      );
    } catch {
      coerceArray(data)
        .flat()
        .forEach(item => {
          if (data instanceof VirtualNode) {
            item.mount(parent, before);
          } else if (item instanceof Node) {
            insert(parent, item, before);
          } else {
            const node = document.createTextNode(item);
            insert(parent, node, before);
          }
        });
    }
  }

  private setAttribute(node: Node, key: string, data: any) {
    const element = node as Element;
    if (!element.setAttribute) {
      return;
    }
    try {
      const subscription = tryParseObservable(data).subscribe(
        value => this.setAttribute(node, key, value),
        { initialEmit: true }
      );
    } catch {
      if (data === null || data === undefined) {
        element.removeAttribute(key);
      }
      if (data === true) {
        element.setAttribute(key, '');
      } else {
        element.setAttribute(key, data);
      }
    }
  }

  static create(data: any): VirtualNode[] {
    if (data instanceof VirtualNode) {
      return [data];
    }
    if (data instanceof Node) {
      return [new VirtualNode(data)];
    }
    if (Array.isArray(data)) {
      return data.flatMap(VirtualNode.create);
    }
    return [new VirtualNode(document.createTextNode(data))];
  }
}

export function h(
  template: Node | ((props?: any) => VirtualNode),
  data: any
): VirtualNode {
  return new VirtualNode(template, data);
}
