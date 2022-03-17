import { CustomElement, HTMLTemplate } from '../types';

export const CONTEXT: {
  element: HTMLElement | ShadowRoot | DocumentFragment;
  factory: Function;
  hookIndex: number;
  instance: CustomElement;
  template: HTMLTemplate | (() => HTMLTemplate);
} = {} as any;
