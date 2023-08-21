import { TemplateNode } from '../internal/template-node';

/** Output function prop. */
export interface Output<T> {
  (value: T): void;
  type: 'output';
}

export interface EstrelaComponent<T extends {} = {}> extends Function {
  (): TemplateNode;
  (this: T): TemplateNode;
  (props: T): TemplateNode;
}
