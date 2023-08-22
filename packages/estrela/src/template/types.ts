import { Signal } from '../types';
import { EstrelaElement } from './estrela-element';
import { EstrelaTemplate } from './estrela-template';

type NodeChild = [child: unknown, before: number | null];
type WithEffect<T = unknown> = T | (() => T);

export interface EstrelaFragment extends DocumentFragment {
  template: EstrelaTemplate;
  instance?: EstrelaElement;
}

export interface NodeData {
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
  lastNodes?: Map<string, Node>;
}
