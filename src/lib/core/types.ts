import { ObservableState } from './observable';
import { HTMLTemplate } from './template';

export type Props<T extends Object> = {
  [P in keyof T]: ObservableState<T[P]>;
};

export interface Component<T = {}> {
  (props: Props<T>): HTMLTemplate;
}
