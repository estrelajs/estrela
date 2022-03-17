import { CustomElement } from '../types';

export const CONTEXT: {
  element: HTMLElement | ShadowRoot;
  factory: Function;
  instance: CustomElement;
} = {} as any;
