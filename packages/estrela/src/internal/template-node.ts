import { Signal, effect } from '../signal';
import { coerceArray, isFunction, isNil } from '../utils';
import { binNode, bindProp } from './element-bind';
import { EstrelaNode, EstrelaProps } from './template';
import {
  addEventListener,
  coerceNode,
  insertChild,
  removeChild,
  setAttribute,
} from './node-api';
import { patchChildren } from './patch';

type NodeChild = [child: unknown, before: number | null];
type WithEffect<T = unknown> = T | (() => T);

interface NodeData {
  [key: `bind:${string}`]: Signal<unknown>;
  [key: `on:${string}`]: (event: Event) => void;
  ref?: (node: Node) => void;
  bind?: Signal<unknown>;
  children?: NodeChild[];
  class?: WithEffect<string | string[] | Record<string, boolean>>;
  style?: WithEffect<string | Record<string, string>>;
}

export interface NodeTrack {
  cleanup: () => void;
  isRoot?: boolean;
  lastNodes?: Map<string, Node | EstrelaNode>;
}

export class TemplateNode implements EstrelaNode {
  private mounted = false;
  private nodes: Node[] = [];
  private styleId?: string;

  private readonly trackMap = new Map<string, NodeTrack>();
  private readonly treeMap = new Map<number, Node>();

  get firstChild(): Node | null {
    return this.nodes[0] ?? null;
  }

  get isConnected(): boolean {
    return this.mounted;
  }

  constructor(
    public readonly template: HTMLTemplateElement,
    public props: EstrelaProps
  ) {}

  mount(parent: Node, before: Node | null = null): Node[] {
    // when node is already mounted
    if (this.isConnected) {
      this.nodes.forEach(node => insertChild(parent, node, before));
      return this.nodes;
    }

    // is Node
    const clone = this.template.content.cloneNode(true);
    const firstChild = clone.firstChild as HTMLElement | null;
    if (firstChild?.hasAttribute?.('_tmpl_')) {
      clone.removeChild(firstChild);
      Array.from(firstChild.childNodes).forEach(child =>
        clone.appendChild(child)
      );
    }
    this.nodes = Array.from(clone.childNodes);

    this.mapNodeTree(parent, clone);
    insertChild(parent, clone, before);
    this.patchProps(this.props);

    this.mounted = true;
    return this.nodes;
  }

  unmount(): void {
    this.trackMap.forEach(track => {
      track.cleanup();
      track.lastNodes?.forEach(node => {
        if (track.isRoot) {
          removeChild(node);
        } else if (node instanceof TemplateNode) {
          node.unmount();
        }
      });
    });
    this.trackMap.clear();
    this.treeMap.clear();
    this.nodes.forEach(node => removeChild(node));
    this.nodes = [];
    this.mounted = false;
  }

  patchProps(props: EstrelaProps): void {
    this.props = props;
    for (let key in props) {
      const index = Number(key);
      const node = this.treeMap.get(index);
      if (node) {
        const nodeData = props[key] as NodeData;
        this.patchNode(key, node, nodeData, index === 0);
      }
    }
  }

  private getNodeTrack(
    trackKey: string,
    trackLastNodes?: boolean,
    isRoot?: boolean
  ): NodeTrack {
    let track = this.trackMap.get(trackKey);
    if (!track) {
      track = { cleanup: () => {} };
      if (trackLastNodes) {
        track.lastNodes = new Map();
      }
      if (isRoot) {
        track.isRoot = true;
      }
      this.trackMap.set(trackKey, track);
    }
    track.cleanup();
    return track;
  }

  private mapNodeTree(parent: Node, tree: Node): void {
    let index = 1;
    this.treeMap.set(0, parent);
    const walk = (node: Node) => {
      if (node.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) {
        this.treeMap.set(index++, node);
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
  }

  private patchNode(
    key: string,
    node: Node,
    nodeData: NodeData,
    isRoot: boolean
  ): void {
    for (let attr in nodeData) {
      // handle children
      if (attr === 'children' && nodeData.children) {
        nodeData.children.forEach(([child, path], index) => {
          const before = isNil(path) ? null : this.treeMap.get(path) ?? null;
          const trackKey = `${key}:${attr}:${index}`;
          const track = this.getNodeTrack(trackKey, true, isRoot);
          patchChild(track, node, child, before);
        });
      }

      // handle ref
      else if (attr === 'ref' && nodeData.ref) {
        if (isFunction(nodeData.ref)) {
          nodeData.ref(node);
        }
      }

      // handle binding
      else if (attr === 'bind' && nodeData.bind) {
        const track = this.getNodeTrack(`${key}:${attr}`);
        binNode(node, nodeData.bind, track);
      } else if (key.startsWith('bind:')) {
        const prop = key.slice(5);
        const signal = nodeData[attr as `bind:${string}`];
        const track = this.getNodeTrack(`${key}:${attr}`);
        const bind = bindProp(node, signal, track);
        bind(
          'change',
          () => (node as any)[prop],
          value => ((node as any)[prop] = value)
        );
      }

      // handle events
      else if (attr.startsWith('on:')) {
        const eventName = attr.substring(3);
        const track = this.getNodeTrack(`${key}:${attr}`);
        const listener = nodeData[attr as `on:${string}`];
        track.cleanup = addEventListener(node, eventName, listener);
      }

      // handle attributes
      else {
        const track = this.getNodeTrack(`${key}:${attr}`);
        const data = nodeData[attr as keyof NodeData];
        patchAttribute(track, node, attr, data);
      }
    }
  }
}

function patchAttribute(
  track: NodeTrack,
  node: Node,
  attr: string,
  data: unknown
): void {
  const element = node as HTMLElement;
  if (!element.setAttribute) {
    return;
  }
  if (isFunction(data)) {
    track.cleanup = effect(() => {
      setAttribute(element, attr, data());
    });
  } else {
    setAttribute(element, attr, data);
  }
}

function patchChild(
  track: NodeTrack,
  parent: Node,
  child: unknown,
  before: Node | null
): void {
  // if child is effect function
  if (isFunction(child)) {
    track.cleanup = effect(() => {
      const nextNodes = coerceArray(child()).map(coerceNode);
      track.lastNodes = patchChildren(
        parent,
        track.lastNodes!,
        nextNodes,
        before
      );
    });
  }

  // else insert node
  else {
    coerceArray(child).forEach((node, i) => {
      const newNode = coerceNode(node);
      track.lastNodes!.set(String(i), newNode);
      insertChild(parent, newNode, before);
    });
  }
}
