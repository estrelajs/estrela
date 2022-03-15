import { HTMLResult } from '../template/html-result';
import { CustomElement } from './custom-element';

/** Functional Element */
export interface FunctionalElement {
  (elementRef: CustomElement): {
    (): HTMLResult | null;
  };
}
