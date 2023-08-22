import { effect } from '../signal';
import { addEventListener, coerceArray, isFunction, isNil } from '../utils';
import { bindNode, bindProp } from './binding';
import { EstrelaTemplate } from './estrela-template';
import { coerceNode, insertChild, removeChild, setAttribute } from './node-api';
import { patchChildren } from './patch';
import { NodeData, NodeTrack } from './types';

export class EstrelaElement {
  setProps?: (fn: (value: {}) => {}) => void;
  track = new Map<string, NodeTrack>();

  get firstChild(): Node | null {
    return this.nodes[0] ?? null;
  }

  constructor(
    public nodes: Node[],
    private nodeTree: Map<number, Node>,
    public template: EstrelaTemplate
  ) {}

  patchProps(props: Record<string, unknown>): void {
    if (this.setProps) {
      this.setProps(() => props);
      return;
    }

    for (let key in props) {
      const index = Number(key);
      const node = this.nodeTree.get(index);
      if (node) {
        const nodeData = props[key] as NodeData;
        this.patchNode(key, node, nodeData, index === 0);
      }
    }
  }

  unmount(): void {
    this.track.forEach(track => {
      track.cleanup();
      track.lastNodes?.forEach(node => {
        if (track.isRoot) {
          removeChild(node);
        } else if (node instanceof EstrelaElement) {
          node.unmount();
        }
      });
    });
    this.track.clear();
    this.nodeTree.clear();
    this.nodes.forEach(node => removeChild(node));
  }

  private getNodeTrack(
    trackKey: string,
    trackLastNodes?: boolean,
    isRoot?: boolean
  ): NodeTrack {
    let track = this.track.get(trackKey);
    if (!track) {
      track = { cleanup: () => {} };
      if (trackLastNodes) {
        track.lastNodes = new Map();
      }
      if (isRoot) {
        track.isRoot = true;
      }
      this.track.set(trackKey, track);
    }
    track.cleanup();
    return track;
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
          const before = isNil(path) ? null : this.nodeTree.get(path) ?? null;
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
        bindNode(node, nodeData.bind, track);
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
