import { EventEmitter, State } from '../observables';
import { StateProxy } from '../state-proxy';

export interface Component<Props = {}, Children = JSX.Children, Context = {}> {
  (
    props: Props extends { children: any }
      ? Props
      : Props & { children?: Children },
    context: Context
  ): JSX.Element;
}

export type EventHandler<T> = ((value: T) => void) | EventEmitter<T> | State<T>;

export type HTMLEventHandler<T, E extends Event> = EventHandler<
  E & { target: T }
>;

export type Key = string | number | symbol;

export type Props<T extends Object> = StateProxy<T>;
