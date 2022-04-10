import { Attrs, Classes, Key, Props, VNodeStyle } from 'snabbdom';
import { ObservableState } from '../../core';

export type Ref = ((el: HTMLElement) => void) | ObservableState<HTMLElement>;

export interface AttributeData {
  attrs: Attrs;
  class: Classes;
  key: Key | undefined;
  props: Props;
  ref: Ref | undefined;
  style: VNodeStyle;
}
