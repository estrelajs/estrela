import { Component, EventEmitter, Observable, State } from '../core';
import { ComponentRef } from './virtual-dom/component-ref';

type SyncOrAsync<T> = T | Observable<T>;

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
export declare type Styles = Record<string, string> & {
  delayed?: Record<string, string>;
  remove?: Record<string, string>;
};

export interface VirtualNodeData {
  attrs?: Attrs;
  bind?: State<any>;
  binds?: Binds;
  classes?: Classes;
  events?: Events;
  key?: Key;
  props?: Props;
  ref?: Ref;
  slot?: string;
  styles?: Styles;
}

export interface VirtualNode {
  sel: string | null;
  data?: VirtualNodeData;
  children?: VirtualNode[];
  Component?: Component;
  componentRef?: ComponentRef;
  element?: Node;
  listener?: (e: Event) => void;
  observable?: Observable<any>;
  text?: string | null;
}
