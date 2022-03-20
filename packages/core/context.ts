import { CustomElement, HTMLTemplate } from '../types';

export const CONTEXT: {
  element: HTMLElement | ShadowRoot | DocumentFragment;
  factory: Function;
  directiveIndex: number;
  instance: CustomElement;
  template: HTMLTemplate | (() => HTMLTemplate);
} = {} as any;
