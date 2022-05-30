import { EventEmitter, State } from '../observables';

export interface Component<P = {}, C = JSX.Children> {
  (props: P extends { children: any } ? P : P & { children?: C }): JSX.Element;
}

export type EventHandler<T> = ((value: T) => void) | EventEmitter<T> | State<T>;

export type HTMLEventHandler<T, E extends Event> = EventHandler<
  E & { target: T }
>;

export type Key = string | number | symbol;
