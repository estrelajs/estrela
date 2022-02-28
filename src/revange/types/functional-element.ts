import { HTMLResult } from '../template/html-result';
import { CustomElement } from './custom-element';

export interface FE {
  (elementRef: CustomElement): {
    (): HTMLResult | null;
  };
}
