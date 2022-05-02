import { EventEmitterHandler, State, Subscribable } from '../core';

export type SyncOrAsync<T> = T | Promise<T> | Subscribable<T>;

export type Attrs = Record<string, SyncOrAsync<string | number | boolean>>;
export type Classes = Record<string, SyncOrAsync<boolean>>;
export type Events = Record<
  string,
  {
    accessor?: string;
    filters: string[];
    handler: EventEmitterHandler<any>;
  }
>;
export type Key = string | number | symbol;
export type Props = Record<string, SyncOrAsync<any>>;
export type Ref = ((el: HTMLElement) => void) | State<HTMLElement>;
export type Styles = Record<string, SyncOrAsync<string>>;

export interface VirtualNodeData {
  attrs?: Attrs;
  bind?: State<any>;
  class?: SyncOrAsync<string | string[] | Classes>;
  classes?: Classes;
  events?: Events;
  key?: Key;
  props?: Props;
  ref?: Ref;
  slot?: string;
  style?: SyncOrAsync<string | Styles>;
  styles?: Styles;
}

export interface NodeMetadata {
  parent: Node | null;
  element: Node | null;
  children: Node[];
  childIndex: number;
  isFragment: boolean;
}

export type PropertiesOf<T> = Pick<
  T,
  {
    [K in keyof T]: T[K] extends Function ? never : K;
  }[keyof T]
>;
