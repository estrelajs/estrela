import { EstrelaTemplate } from '../template';

/** Output function prop. */
export interface Output<T> {
  (value: T): void;
  type: 'output';
}

export interface EstrelaComponent<T extends {} = {}> extends Function {
  (): EstrelaTemplate;
  (this: T): EstrelaTemplate;
  (props: T): EstrelaTemplate;
}
