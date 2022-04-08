import { HTMLTemplate } from './html';
import { ObservableState } from './observable';

export type Props<T extends Object> = {
  [P in keyof T]: ObservableState<T[P]>;
};

export interface Component<T extends Object = {}> {
  (props: Props<T>): HTMLTemplate;
  styles?: string | string[];
}
