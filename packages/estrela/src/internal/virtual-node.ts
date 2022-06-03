import { isCompletable, Subscription } from '../observables';
import { StateProxy } from '../state-proxy';
import { Key } from '../types/types';
import { coerceArray } from '../utils';
import { effect } from './effect';
import {
  coerceNode,
  insertChild,
  mapNodeTree,
  patchChildren,
  removeChild,
  setAttribute,
} from './node-api';
import { StateProxyHandler } from './proxy-handler';

type NodeInsertion = [JSX.Children, number | null];

export interface NodeData {
  [key: Key]: any;
  children?: NodeInsertion[];
}

export class VirtualNode {
  private cleanup = new Subscription();
  private nodes: Node[] = [];
  private props: StateProxy<NodeData> = {} as any;
  private componentNode?: VirtualNode;

  get isComponent(): boolean {
    return typeof this.template === 'function';
  }

  get firstChild(): Node | null {
    return this.nodes[0] ?? null;
  }

  get nextSibling(): Node | null {
    return this.nodes.at(-1)?.nextSibling ?? null;
  }

  constructor(
    readonly template: DocumentFragment | ((props?: any) => VirtualNode),
    public data?: NodeData
  ) {}

  mount(parent: Node, before: Node | null = null): Node[] {
    this.props = this.createProps(this.data ?? {});

    // is Component
    if (typeof this.template === 'function') {
      this.componentNode = this.template(this.props);
      this.nodes = this.componentNode.mount(parent, before);
      return this.nodes;
    }

    // is Node
    const clone = this.template.cloneNode(true);
    const tree = mapNodeTree(clone, { skipRoot: true });

    for (let key in this.data) {
      const node = tree[Number(key)];
      const data = this.data[key];
      this.handleNode(tree, node, data);
    }

    this.nodes = Array.from(clone.childNodes);
    insertChild(parent, clone, before);
    delete this.data;
    return this.nodes;
  }

  patch(data?: NodeData) {
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
      const prop = this.props.$[key];
      if (isCompletable(prop)) {
        prop.complete();
      }
    }
    this.props = {} as any;
    this.cleanup.unsubscribe();
    this.cleanup = new Subscription();
    if (this.componentNode) {
      this.componentNode.unmount(parent);
    } else {
      this.nodes.forEach(node => removeChild(parent, node));
    }
    this.nodes = [];
  }

  private createProps(data: NodeData): StateProxy<NodeData> {
    if (!this.isComponent) {
      data = this.normalizeData(data);
    }
    return new Proxy(
      {} as StateProxy<NodeData>,
      new StateProxyHandler(data, this.cleanup)
    );
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
        const handler = data[key];
        node.addEventListener(eventName, handler);
        this.cleanup.add(() => node.removeEventListener(eventName, handler));
      } else {
        this.setAttribute(node, key, data[key]);
      }
    }
  }

  private insert(parent: Node, data: any, before: Node | null): void {
    if (typeof data === 'function') {
      let lastValue: any = undefined;
      let nodes: (Node | VirtualNode)[] = [];

      // insert placeholder node
      const placeholder = document.createComment('');
      insertChild(parent, placeholder, before);

      // subscribe effect
      const subscription = effect<JSX.Children>(data).subscribe(value => {
        if (lastValue !== value) {
          lastValue = value;
          nodes = patchChildren(
            parent,
            nodes,
            coerceArray(value).flat().map(coerceNode),
            placeholder
          );
        }
      });

      // add cleanup
      this.cleanup.add(subscription);
    } else {
      // insert node
      coerceArray(data)
        .flat()
        .forEach(node => insertChild(parent, coerceNode(node), before));
    }
  }

  private normalizeData(data?: NodeData): NodeData {
    const result: NodeData = {};

    const isStatic = (value: any, key?: string) =>
      key?.startsWith('on:') ||
      value instanceof VirtualNode ||
      typeof value === 'function';

    for (let key in data) {
      const props = data[key];
      for (let prop in props) {
        if (isStatic(props[prop], prop)) {
          continue;
        }
        if (prop === 'children') {
          for (let i = 0; i < props.children.length; i++) {
            if (isStatic(props.children[i][0])) {
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
    if (typeof data === 'function') {
      let lastValue: any = undefined;
      const subscription = effect(data).subscribe(value => {
        if (lastValue !== value) {
          lastValue = value;
          setAttribute(element, key, value);
        }
      });
      this.cleanup.add(subscription);
    } else {
      setAttribute(element, key, data);
    }
  }
}

export function h(
  template: DocumentFragment | ((props?: any) => VirtualNode),
  data: NodeData
): VirtualNode {
  return new VirtualNode(template, data);
}
