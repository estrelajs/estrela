import { TemplateNode } from '../internal/template-node';

/** Output function prop. */
export interface Output<T> {
  (value: T): void;
  type: 'output';
}

export interface EstrelaComponent extends Function {
  (): TemplateNode;
}
