import {
  createEventEmitter,
  EventEmitter,
  from,
  isCompletable,
  isNextable,
  isSelectable,
  State,
  Subscription,
  Unsubscribable
} from '../observables';
import { StateProxy } from '../state-proxy';
import { Key } from '../types/types';
import { coerceArray, identity, isNil } from '../utils';
import { effect } from './effect';
import { addEventListener } from './events';
import {
  coerceNode,
  insertChild,
  removeChild,
  replaceChild,
  setAttribute
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
  public styleId?: string;

  private cleanup = new Subscription();
  private componentTemplate?: VirtualNode;
  private mounted = false;
  private nodes: Node[] = [];
  private props: StateProxy<NodeData> = {} as any;
  private propsCleanup = new Map<string, Unsubscribable>();
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
    public id?: Key
  ) {}

  addHook(name: 'init' | 'destroy', handler: () => void): void {
    const hooks = this.hooks[name] ?? [];
    hooks.push(handler);
    this.hooks[name] = hooks;
  }

  cloneNode(children?: boolean): VirtualNode {
    const data = { ...this.data };
    if (this.isComponent) {
      return new VirtualNode(this.template, data, this.id);
    } else {
      const clone = (this.template as DocumentFragment).cloneNode(children);
      return new VirtualNode(clone as DocumentFragment, data, this.id);
    }
  }

  dispose(): void {
    if (this.componentTemplate) {
      this.componentTemplate.dispose();
    }
    this.hooks.destroy.forEach(handler => handler());
    this.propsCleanup.forEach(p => p.unsubscribe());
    this.cleanup.unsubscribe();
    this.mounted = false;
    // for (let key in this.props) {
    //   const prop = this.props.$[key];
    //   if (isCompletable(prop)) {
    //     prop.complete();
    //   }
    // }
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

    // else need to be mounted
    this.createProps();

    // is Component
    if (typeof this.template === 'function') {
      VirtualNode.ref = this;
      this.componentTemplate = this.template(this.props, this.context);
      this.componentTemplate.context = this.context;
      if (this.template.hasOwnProperty('styleId')) {
        const styleId = (this.template as any).styleId;
        this.componentTemplate.styleId = styleId;
        this.styleId = styleId;
      }
      this.nodes = this.componentTemplate.mount(
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
    const tree = this.mapNodeTree(clone);
    insertChild(parent, clone, before);
    this.mounted = true;

    for (let key in this.data) {
      const index = Number(key);
      const isRoot = index === -1;
      const node = isRoot ? parent : tree[index];

      if (node instanceof HTMLSlotElement) {
        this.handleSlot(node, index, children, isRoot);
      } else {
        this.handleNode(node, index, tree, isRoot);
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
      if (key.startsWith('on:')) {
        const eventName = key.substring(3);
        this.propsCleanup.get(key)?.unsubscribe();
        let emitter: EventEmitter<any> | undefined = this.props[eventName];
        if (emitter) {
          emitter.complete();
        }
        emitter = createEventEmitter();
        const subscription = emitter.subscribe(v => {
          if (typeof value === 'function') {
            value(v);
          } else if (isNextable(value)) {
            value.next(v);
          }
        });
        this.props[eventName] = emitter;
        this.propsCleanup.set(key, subscription);
      } else if (key.startsWith('bind:')) {
        const proto = Object.getPrototypeOf(this.props);
        proto[key.substring(5)] = value;
      } else if (isSelectable(value)) {
        this.propsCleanup.get(key)?.unsubscribe();
        const subscriber = (value: any) => {
          if (value !== this.props[key]) {
            this.props[key] = value;
          }
        };
        const subscription = from(value).subscribe(subscriber);
        this.propsCleanup.set(key, subscription);
      } else {
        this.props[key] = value;
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

  private createProps(): void {
    for (let key in this.props) {
      const prop = this.props.$[key];
      if (isCompletable(prop)) {
        prop.complete();
      }
    }
    this.props = new Proxy(
      {} as StateProxy<NodeData>,
      new StateProxyHandler({})
    );
    this.patch(this.data);
  }

  private handleNode(
    node: Node,
    index: number,
    tree: Record<Key, Node>,
    isRoot: boolean
  ): void {
    const data = this.data[index];
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
        this.cleanup.add(
          addEventListener(node, eventName, (event: Event) =>
            this.data[index][key](event)
          )
        );
      } else {
        this.setAttribute(node, key, data[key]);
      }
    }
  }

  private handleSlot(
    node: HTMLSlotElement,
    index: number,
    children: State<any> | undefined,
    isRoot: boolean
  ): void {
    const parent = node.parentNode;
    const data = this.data[index];
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
            .map(node => coerceNode(node, this.context, this.styleId));
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
          node = coerceNode(node, this.context, this.styleId);
          lastNodes.set(i, node);
          insertChild(parent, node, before);
        });
    }

    // destroy cleanup
    this.cleanup.add(() => {
      lastNodes.forEach(node => {
        if (isRoot) {
          removeChild(parent, node);
        } else if (node instanceof VirtualNode) {
          node.dispose();
        }
      });
    });
  }

  private mapNodeTree(tree: Node): Record<number, Node> {
    let index = 0;
    const result: Record<number, Node> = {};
    const walk = (node: Node) => {
      const isFragment = node instanceof DocumentFragment;
      if (!isFragment) {
        result[index++] = node;
      }
      let child = node.firstChild;
      if (child && isFragment) {
        this.nodes.push(child);
      }
      while (child) {
        walk(child);
        child = child.nextSibling;
        if (child && isFragment) {
          this.nodes.push(child);
        }
      }
      if (this.styleId) {
        (node as Element).setAttribute?.(`_${this.styleId}`, '');
      }
    };
    walk(tree);
    return result;
  }

  private normalizeData(data?: NodeData): NodeData {
    const result: NodeData = {};

    for (let key in data) {
      const props = data[key];
      for (let prop in props) {
        // these properties won't change when props are patched
        if (prop === 'ref' || prop === 'bind' || prop.startsWith('bind:') || prop.startsWith('on:')) {
          continue;
        }
        if (prop === 'children') {
          for (let i = 0; i < props.children.length; i++) {
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
