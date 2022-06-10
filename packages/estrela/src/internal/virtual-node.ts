import { isCompletable, State, Subscription } from '../observables';
import { StateProxy } from '../state-proxy';
import { Key } from '../types/types';
import { coerceArray, identity } from '../utils';
import { effect } from './effect';
import { addEventListener } from './events';
import {
  coerceNode,
  insertChild,
  mapNodeTree,
  removeChild,
  setAttribute,
} from './node-api';
import { patchChildren } from './patch';
import { StateProxyHandler } from './proxy-handler';

type NodeInsertion = [JSX.Children, number | null];

export interface NodeData {
  [key: Key]: any;
  children?: NodeInsertion[];
}

export class VirtualNode {
  private cleanup = new Subscription();
  private mounted = false;
  private nodes: Node[] = [];
  private props?: StateProxy<NodeData>;
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
    public data?: NodeData,
    public key?: Key
  ) { }

  cloneNode(children?: boolean): VirtualNode {
    const data = { ...this.data };
    if (this.isComponent) {
      return new VirtualNode(this.template, data, this.key);
    } else {
      const clone = (this.template as DocumentFragment).cloneNode(children);
      return new VirtualNode(clone as DocumentFragment, data, this.key);
    }
  }

  dispose(): void {
    if (this.componentNode) {
      this.componentNode.dispose();
    }
    for (let key in this.props) {
      const prop = this.props.$[key];
      if (isCompletable(prop)) {
        prop.complete();
      }
    }
    delete this.props;
    this.cleanup.unsubscribe();
    this.cleanup = new Subscription();
    this.mounted = false;
    this.nodes = [];
  }

  mount(parent: Node, before: Node | null = null): Node[] {
    if (this.mounted) {
      this.nodes.forEach(node => insertChild(parent, node, before));
      return this.nodes;
    }

    this.props = this.createProps(this.data ?? {});
    this.mounted = true;

    // is Component
    if (typeof this.template === 'function') {
      this.componentNode = this.template(this.props);
      this.nodes = this.componentNode.mount(parent, before);
      return this.nodes;
    }

    // is Node
    const clone = this.template.cloneNode(true);
    const tree = mapNodeTree(clone);

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
        this.props?.[key] !== value
      ) {
        this.props?.$[key].next(value);
      }
    }
  }

  unmount(parent: Node) {
    if (this.componentNode) {
      this.componentNode.unmount(parent);
    } else {
      this.nodes.forEach(node => removeChild(parent, node));
    }
    this.dispose();
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
      } else if (key === 'ref') {
        const ref = data[key];
        if (typeof ref === 'function') {
          ref(node);
        }
        if (ref instanceof State) {
          ref.next(node);
        }
      } else if (key === 'bind') {
        this.bindInput(node, data[key]);
      } else if (key.startsWith('bind:')) {
        const prop = key.slice(5);
        if (data[key] instanceof State) {
          this.bindProp(node as any, prop, data[key], { updateAttr: false });
        }
      } else if (key.startsWith('on:')) {
        const eventName = key.substring(3);
        this.cleanup.add(addEventListener(node, eventName, data[key]));
      } else {
        this.setAttribute(node, key, data[key]);
      }
    }
  }

  private bindInput(node: Node, state: State<any>): void {
    if (node instanceof HTMLInputElement) {
      if (node.type === 'text') {
        this.bindProp(node, 'value', state);
      }
      if (node.type === 'number') {
        this.bindProp(node, 'value', state, {
          getter: () => Number.isNaN(node.valueAsNumber) ? undefined : node.valueAsNumber,
          setter: value => value ?? '',
        });
      }
      if (node.type === 'date') {
        this.bindProp(node, 'value', state, {
          on: 'change',
          getter: () => node.valueAsDate,
          setter: (value: Date) => `${value.toISOString().slice(0, 10)}`,
        });
      }
      if (node.type === 'time') {
        this.bindProp(node, 'value', state, {
          on: 'change',
          getter: () => node.valueAsDate,
          setter: (value: Date) => `${value.toISOString().slice(11, 16)}`,
        });
      }
      if (node.type === 'checkbox') {
        this.bindProp(node, 'checked', state, {
          on: 'change',
          getter: () => node.checked,
          setter: value => Boolean(value),
        });
      }
      if (node.type === 'radio') {
        this.bindProp(node, 'checked', state, {
          on: 'change',
          getter: () => node.value,
          setter: value => node.value === value,
        });
      }
      if (node.type === 'file') {
        this.bindProp(node, 'files', state, {
          on: 'change',
        });
      }
    }
    if (node instanceof HTMLSelectElement) {
      this.bindProp(node, 'selectedIndex', state, {
        on: 'change',
        getter: () => node.options.item(node.selectedIndex)?.value,
        setter: value => Array.from(node.options).findIndex(option => option.value === value),
      })
    }
    if (node instanceof HTMLTextAreaElement) {
      this.bindProp(node, 'value', state);
    }
  }

  private bindProp<T extends HTMLElement, R>(
    node: T,
    prop: keyof T & string,
    state: State<R>,
    {
      getter = this.bindHandler<T, R>,
      setter = identity as (value: any) => R,
      on = 'both' as 'both' | 'input' | 'change',
      updateAttr = true,
      updateProp = true,
    } = {}
  ): void {
    let lastValue: any = node[prop];

    const bindUpdate = (value: any) => {
      if (lastValue !== value) {
        lastValue = value;
        if (state.$ !== value) {
          state.next(value);
        }
        value = setter(value);
        if (updateProp && node[prop] !== value) {
          node[prop] = value;
        }
        if (updateAttr) {
          this.setAttribute(node, prop, value);
        }
      }
    };

    const subscription = state.subscribe(bindUpdate, { initialEmit: true });
    const listener = (event: Event) => bindUpdate(getter(event as any));
    if (on === 'change' || on === 'both') {
      subscription.add(addEventListener(node, 'change', listener));
    }
    if (on === 'input' || on === 'both') {
      subscription.add(addEventListener(node, 'input', listener));
    }

    this.cleanup.add(subscription);
  }

  private bindHandler<T, R>(event: Event & { target: T }): R {
    return (event.target as any).value;
  }

  private insert(parent: Node, data: any, before: Node | null): void {
    if (typeof data === 'function') {
      let lastValue: any = undefined;
      let lastNodes: any = new Map();

      // subscribe effect
      const subscription = effect<JSX.Children>(data).subscribe(value => {
        if (lastValue !== value) {
          lastValue = value;
          lastNodes = patchChildren(
            parent,
            lastNodes,
            coerceArray(value).flat().map(coerceNode),
            before
          );
        }
      });

      // add cleanup
      this.cleanup.add(subscription);
    } else {
      // insert node
      coerceArray(data)
        .flat()
        .forEach(node => {
          insertChild(parent, coerceNode(node), before);
        });
    }
  }

  private normalizeData(data?: NodeData): NodeData {
    const result: NodeData = {};

    const isStatic = (value: any, key?: string) =>
      key?.startsWith('on:') ||
      value instanceof VirtualNode ||
      value instanceof State ||
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
            props.children[i][0] = () => this.props?.[name];
          }
        } else {
          const name = `${key}:${prop}`;
          result[name] = props[prop];
          props[prop] = () => this.props?.[name];
        }
      }
    }

    return result;
  }

  private setAttribute(node: Node, key: string, data: any): void {
    const element = node as HTMLElement;
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
  data: NodeData,
  key?: Key
): VirtualNode {
  return new VirtualNode(template, data, key);
}
