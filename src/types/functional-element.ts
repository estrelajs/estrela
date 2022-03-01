import { HTMLResult } from '../template/html-result';
import { CustomElement } from './custom-element';

/** Functional Element */
export interface Fel {
  (elementRef: CustomElement): {
    (): HTMLResult | null;
  };
}
