import { Component, EventEmitter, State, Subscribable } from '../core';
import { ComponentRef } from './virtual-dom/component-ref';

type SyncOrAsync<T> = T | Promise<T> | Subscribable<T>;

export type Attrs = Record<string, SyncOrAsync<string | number | boolean>>;
export type Binds = Record<string, State<any>>;
export type Classes = Record<string, SyncOrAsync<boolean>>;
export type Events = Record<
  string,
  {
    accessor?: string;
    filters: string[];
    handler: ((e: any) => void) | EventEmitter<any> | State<any>;
  }
>;
export type Key = string | number | symbol;
export type Props = Record<string, SyncOrAsync<any>>;
export type Ref = ((el: HTMLElement) => void) | State<HTMLElement>;
export declare type Styles = Record<string, SyncOrAsync<string>>;

export interface VirtualNodeData {
  attrs?: Attrs;
  bind?: State<any>;
  binds?: Binds;
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

export interface VirtualNode {
  sel?: string;
  data?: VirtualNodeData;
  children?: VirtualNode[];
  Component?: Component;
  componentRef?: ComponentRef;
  element?: Node;
  listener?: (e: Event) => void;
  observable?: Promise<any> | Subscribable<any>;
  text?: string | null;
}
