import { isCompletable, State, Subscription } from '../observables';
import { StateProxy } from '../state-proxy';
import { Key } from '../types/types';
import { coerceArray, identity, isNil } from '../utils';
import { effect } from './effect';
import { addEventListener } from './events';
import {
  coerceNode,
  insertChild,
  mapNodeTree,
  removeChild,
  replaceChild,
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
  public context: any = {};
  private cleanup = new Subscription();
  private componentNode?: VirtualNode;
  private mounted = false;
  private nodes: Node[] = [];
  private props?: StateProxy<NodeData>;
  private hooks: Record<'init' | 'destroy', (() => void)[]> = {
    init: [],
    destroy: [],
  };

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
    readonly template:
      | DocumentFragment
      | ((props?: any, context?: any) => VirtualNode),
    public data: NodeData,
    public key?: Key
  ) {}

  addHook(name: 'init' | 'destroy', handler: () => void): void {
    const hooks = this.hooks[name] ?? [];
    hooks.push(handler);
    this.hooks[name] = hooks;
  }

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
    this.hooks.destroy.forEach(handler => handler());
    this.hooks.destroy = [];
    this.hooks.init = [];
    if (this.componentNode) {
      this.componentNode.dispose();
      delete this.componentNode;
    }
    for (let key in this.props) {
      const prop = this.props.$[key];
      if (isCompletable(prop)) {
        prop.complete();
      }
    }
    delete this.props;
    this.mounted = false;
    this.cleanup.unsubscribe();
    this.cleanup = new Subscription();
  }

  mount(
    parent: Node,
    before: Node | null = null,
    children?: State<any>
  ): Node[] {
    if (this.mounted) {
      this.nodes.forEach(node => insertChild(parent, node, before));
      return this.nodes;
    }

    this.props = this.createProps(this.data);

    // is Component
    if (typeof this.template === 'function') {
      VirtualNode.ref = this;
      this.componentNode = this.template(this.props, this.context);
      this.componentNode.context = this.context;
      this.nodes = this.componentNode.mount(
        parent,
        before,
        this.props.$.children
      );
      this.mounted = true;
      this.hooks.init?.forEach(handler => handler());
      VirtualNode.ref = null;
      return this.nodes;
    }

    // is Node
    const clone = this.template.cloneNode(true);
    const tree = mapNodeTree(clone);
    this.nodes = Array.from(clone.childNodes);
    insertChild(parent, clone, before);
    this.mounted = true;

    for (let key in this.data) {
      const index = Number(key);
      const isRoot = index === -1;
      const node = isRoot ? parent : tree[index];
      const data = this.data[key];

      if (node instanceof HTMLSlotElement) {
        this.handleSlot(node, data, children, isRoot);
      } else {
        this.handleNode(node, data, tree, isRoot);
      }
    }

    this.hooks.init?.forEach(handler => handler());
    return this.nodes;
  }

  patch(data: NodeData): void {
    this.data = data;
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

  unmount(parent: Node): void {
    this.dispose();
    this.nodes.forEach(node => removeChild(parent, node));
    this.nodes = [];
  }

  private bindInput(node: Node, state: State<any>): void {
    if (node instanceof HTMLInputElement) {
      if (node.type === 'text') {
        this.bindProp(node, 'value', state);
      }
      if (node.type === 'number') {
        this.bindProp(node, 'value', state, {
          getter: () =>
            Number.isNaN(node.valueAsNumber) ? undefined : node.valueAsNumber,
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
        setter: value =>
          Array.from(node.options).findIndex(option => option.value === value),
      });
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

  private createProps(data: NodeData): StateProxy<NodeData> {
    if (!this.isComponent) {
      data = this.normalizeData(data);
    }
    return new Proxy(
      {} as StateProxy<NodeData>,
      new StateProxyHandler(data, this.cleanup)
    );
  }

  private handleNode(
    node: Node,
    data: any,
    tree: Record<Key, Node>,
    isRoot: boolean
  ): void {
    for (let key in data) {
      if (key === 'children') {
        data.children.forEach(([data, path]: NodeInsertion) => {
          const before = isNil(path) ? null : tree[path] ?? null;
          this.insert(node, data, before, isRoot);
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

  private handleSlot(
    node: HTMLSlotElement,
    data: any,
    children: State<any> | undefined,
    isRoot: boolean
  ): void {
    const parent = node.parentNode;
    if (parent && children) {
      const slotEffect = () => {
        const availableChildren = coerceArray(children.$);
        if (availableChildren.length === 0) {
          return node;
        }
        let result: any[];
        if (data.name) {
          result = availableChildren.filter(child => {
            return (
              (child instanceof VirtualNode &&
                child.data[0]?.slot === data.name) ||
              (child instanceof HTMLElement && child.slot === data.name)
            );
          });
        } else if (data.select) {
          result = availableChildren.filter(child => {
            if (typeof data.select === 'function') {
              return (
                child instanceof VirtualNode && child.template === data.select
              );
            }
            if (
              child instanceof VirtualNode &&
              child.template instanceof Node
            ) {
              return child.template.firstChild?.nodeName === data.select;
            }
            if (child instanceof Node) {
              return child.nodeName === data.select;
            }
          });
        } else {
          result = availableChildren;
        }
        return result?.map(child => child.cloneNode?.(true) ?? child) ?? node;
      };
      const before = document.createComment('');
      replaceChild(parent, before, node);
      this.insert(parent, slotEffect, before, isRoot);
    }
  }

  private insert(
    parent: Node,
    data: any,
    before: Node | null,
    isRoot: boolean
  ): void {
    let lastValue: any = undefined;
    let lastNodes = new Map<Key, Node | VirtualNode>();

    if (typeof data === 'function') {
      // subscribe effect
      const subscription = effect<JSX.Children>(data).subscribe(value => {
        if (lastValue !== value) {
          lastValue = value;
          const nextNodes = coerceArray(value)
            .flat()
            .map(node => coerceNode(node, this.context));
          lastNodes = patchChildren(parent, lastNodes, nextNodes, before);
        }
      });

      // add cleanup
      this.cleanup.add(subscription);
    } else {
      // insert node
      coerceArray(data)
        .flat()
        .forEach((node, i) => {
          node = coerceNode(node, this.context);
          lastNodes.set(i, node);
          insertChild(parent, node, before);
        });
    }

    // destroy cleanup
    this.cleanup.add(() => {
      lastNodes.forEach(node => {
        if (isRoot) {
          removeChild(parent, node);
        }
        if (node instanceof VirtualNode) {
          node.dispose();
        }
      });
    });
  }

  private normalizeData(data?: NodeData): NodeData {
    const result: NodeData = {};

    const isStatic = (value: any, key?: string) =>
      key?.startsWith('on:') ||
      value instanceof VirtualNode ||
      value instanceof State ||
      typeof value === 'function';

    for (let key in data) {
      const props = { ...data[key] };
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

  static ref: VirtualNode | null = null;
}

export function h(
  template: DocumentFragment | ((props?: any) => VirtualNode),
  data: NodeData,
  key?: Key
): VirtualNode {
  return new VirtualNode(template, data, key);
}
