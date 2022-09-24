import { EventEmitter } from '../event-emitter';
import { createEffect, createState } from '../state';
import { Key } from '../types/types';
import {
  bindHandler,
  coerceArray,
  identity,
  isFunction,
  isNil,
} from '../utils';
import {
  addEventListener,
  coerceNode,
  insertChild,
  removeChild,
  setAttribute,
} from './node-api';
import { patchChildren } from './patch';

type NodeInsertion = [any, number | null];

type EstrelaNodeData = Record<Key, any>;

export type EstrelaComponent = (props?: any, context?: any) => EstrelaNode;

export class EstrelaNode {
  static ref: EstrelaNode | null = null;

  private context = {};
  private mounted = false;
  private styleId?: string;
  private nodes: Node[] = [];
  private cleanups: (() => void)[] = [];
  private props: Record<string, any> = {};
  private hooks: Record<'init' | 'destroy', (() => void)[]> = {
    init: [],
    destroy: [],
  };

  get firstChild(): Node | null {
    return this.nodes[0] ?? null;
  }

  get isComponent(): boolean {
    return isFunction(this.template);
  }

  get isConnected(): boolean {
    return this.mounted;
  }

  constructor(
    readonly template: HTMLTemplateElement | EstrelaComponent,
    public data: EstrelaNodeData
  ) {}

  addHook(name: 'init' | 'destroy', handler: () => void): void {
    const hooks = this.hooks[name] ?? [];
    hooks.push(handler);
    this.hooks[name] = hooks;
  }

  dispose(): void {
    this.hooks.destroy.forEach(handler => handler());
    this.hooks = { init: [], destroy: [] };
    this.cleanups.forEach(unsubscriber => unsubscriber());
    this.cleanups = [];
    this.mounted = false;
  }

  mount(parent: Node, before: Node | null = null, context = {}): Node[] {
    // when node is already mounted
    if (this.mounted) {
      this.nodes.forEach(node => insertChild(parent, node, before));
      return this.nodes;
    }

    // initialize props
    this.initializeProps();
    this.setContext(context);

    // is Component
    if (isFunction(this.template)) {
      EstrelaNode.ref = this;
      const node = this.template(this.props, this.context);
      EstrelaNode.ref = null;
      if (this.template.hasOwnProperty('styleId')) {
        const styleId = (this.template as any).styleId;
        this.styleId = node.styleId = styleId;
      }
      this.nodes = node.mount(parent, before, this.context);
      this.mounted = true;
      this.cleanups.push(() => node.unmount(parent));
      this.hooks.init?.forEach(handler => handler());
      return this.nodes;
    }

    // is Node
    const clone = this.template.content.cloneNode(true);
    const tree = this.mapNodeTree(parent, clone);
    this.nodes = Array.from(clone.childNodes);
    insertChild(parent, clone, before);
    this.mounted = true;

    for (let key in this.data) {
      const index = Number(key);
      const isRoot = index === 0;
      const node = tree[index];
      const data = this.data[index];
      this.handleNode(node, data, tree, isRoot);
    }

    this.hooks.init?.forEach(handler => handler());
    return this.nodes;
  }

  unmount(parent: Node): void {
    this.dispose();
    this.nodes.forEach(node => removeChild(parent, node));
    this.nodes = [];
  }

  patch(data: EstrelaNodeData): void {
    this.data = data;
    // if (!this.isComponent) {
    //   data = this.normalizeData(data);
    // }

    for (let key in data) {
      const param = data[key];

      // handle bind props
      if (key.startsWith('bind:')) {
        const [state, key] = param;
        const propName = key.substring(5);
        this.props[propName] = state[key];
      }

      // handle events
      else if (key.startsWith('on:')) {
        const eventName = key.substring(3);
        const emitter: EventEmitter =
          this.props[eventName] ?? new EventEmitter();
        this.props[eventName] = emitter;
        this.cleanups.push(emitter.subscribe(param));
      }

      // handle reactive props
      else if (isFunction(param)) {
        const unsubscriber = createEffect(() => {
          const value = param();
          if (this.props[key] !== value) {
            this.props[key] = value;
          }
        });
        this.cleanups.push(unsubscriber);
      } else {
        this.props[key] = param;
      }
    }
  }

  setContext(context: {}): void {
    this.context = context;
  }

  setStyleId(styleId: string): void {
    this.styleId = styleId;
  }

  private bindInput(node: Node, state: [any, string]): void {
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

  private bindProp(
    node: any,
    prop: string,
    [state, key]: [any, string],
    {
      getter = bindHandler as (value: any) => any,
      setter = identity as (value: any) => any,
      on = 'both' as 'both' | 'input' | 'change',
      updateAttr = true,
      updateProp = true,
    } = {}
  ): void {
    let lastValue: any = node[prop];
    const bindUpdate = (value: any) => {
      if (lastValue !== value) {
        lastValue = value;
        if (state[key] !== value) {
          state[key] = value;
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
    const listener = (event: Event) => bindUpdate(getter(event));
    this.cleanups.push(createEffect(() => bindUpdate(state[key])));
    if (on === 'change' || on === 'both') {
      this.cleanups.push(addEventListener(node, 'change', listener));
    }
    if (on === 'input' || on === 'both') {
      this.cleanups.push(addEventListener(node, 'input', listener));
    }
  }

  private handleNode(
    node: Node,
    data: any,
    tree: Record<Key, Node>,
    isRoot: boolean
  ): void {
    for (let key in data) {
      // handle children
      if (key === 'children') {
        data.children.forEach(([data, path]: NodeInsertion) => {
          const before = isNil(path) ? null : tree[path] ?? null;
          this.insert(node, data, before, isRoot);
        });
      }

      // handle ref binding
      else if (key === 'ref') {
        const ref = data[key];
        if (isFunction<[Node]>(ref)) {
          ref(node);
        }
      }

      // handle bind binding
      else if (key === 'bind') {
        this.bindInput(node, data[key]);
      } else if (key.startsWith('bind:')) {
        const prop = key.slice(5);
        this.bindProp(node, prop, data[key], { updateAttr: false });
      }

      // handle events
      else if (key.startsWith('on:')) {
        const eventName = key.substring(3);
        const unsubscriber = addEventListener(node, eventName, data[key]);
        this.cleanups.push(unsubscriber);
      }

      // handle attributes
      else {
        this.setAttribute(node, key, data[key]);
      }
    }
  }

  private initializeProps(): void {
    this.props = createState({});
    this.patch(this.data);
  }

  private insert(
    parent: Node,
    data: any,
    before: Node | null,
    isRoot: boolean
  ): void {
    let lastValue: any = undefined;
    let lastNodes = new Map<Key, Node | EstrelaNode>();

    // if is subscrible
    if (isFunction(data)) {
      const subscription = createEffect(() => {
        const value = data();

        if (lastValue !== value) {
          lastValue = value;
          const nextNodes = coerceArray(value)
            .flat()
            .map(node => coerceNode(node, this.context, this.styleId));
          lastNodes = patchChildren(parent, lastNodes, nextNodes, before);
        }
      });
      this.cleanups.push(subscription);
    }

    // else insert node
    else {
      coerceArray(data)
        .flat()
        .forEach((node, i) => {
          node = coerceNode(node, this.context, this.styleId);
          lastNodes.set(i, node);
          insertChild(parent, node, before);
        });
    }

    // add destroy cleanup
    this.cleanups.push(() => {
      lastNodes.forEach(node => {
        if (isRoot) {
          removeChild(parent, node);
        } else if (node instanceof EstrelaNode) {
          node.dispose();
        }
      });
    });
  }

  private mapNodeTree(parent: Node, tree: Node): Record<number, Node> {
    let index = 1;
    const blackList = [Node.DOCUMENT_FRAGMENT_NODE, Node.TEXT_NODE];
    const result: Record<number, Node> = { 0: parent };
    const walk = (node: Node) => {
      if (!blackList.includes(node.nodeType)) {
        result[index++] = node;
      }
      let child = node.firstChild;
      while (child) {
        walk(child);
        child = child.nextSibling;
      }
      if (this.styleId) {
        (node as Element).setAttribute?.(`_${this.styleId}`, '');
      }
    };
    walk(tree);
    return result;
  }

  // private normalizeData(data?: EstrelaNodeData): EstrelaNodeData {
  //   const result: EstrelaNodeData = {};
  //   for (let key in data) {
  //     const props = data[key];
  //     for (let prop in props) {
  //       // these properties won't change when props are patched
  //       if (
  //         prop === 'ref' ||
  //         prop === 'bind' ||
  //         prop.startsWith('bind:') ||
  //         prop.startsWith('on:')
  //       ) {
  //         continue;
  //       }
  //       if (prop === 'children') {
  //         for (let i = 0; i < props.children.length; i++) {
  //           const name = `${key}:${prop}:${i}`;
  //           result[name] = props.children[i][0];
  //           props.children[i][0] = () => this.props[name];
  //         }
  //       } else {
  //         const name = `${key}:${prop}`;
  //         result[name] = props[prop];
  //         props[prop] = () => this.props[name];
  //       }
  //     }
  //   }
  //   return result;
  // }

  private setAttribute(node: Node, key: string, data: any): void {
    const element = node as HTMLElement;
    if (!element.setAttribute) {
      return;
    }
    if (isFunction(data)) {
      let lastValue: any = undefined;
      const unsubscriber = createEffect(() => {
        const value = data();
        if (lastValue !== value) {
          lastValue = value;
          setAttribute(element, key, value);
        }
      });
      this.cleanups.push(unsubscriber);
    } else {
      setAttribute(element, key, data);
    }
  }
}

export function h(
  template: HTMLTemplateElement | EstrelaComponent,
  data: EstrelaNodeData
): EstrelaNode {
  return new EstrelaNode(template, data);
}
