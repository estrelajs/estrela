import { EventEmitter, State } from '../observables';

export interface Component<P = {}> {
  (props: Props<P>): JSX.Element;
}

export type Props<P> = {
  [K in keyof P]-?: P[K] extends EventEmitter<infer E> | undefined
    ? EventEmitter<E>
    : State<P[K]>;
};

export type JSXProps<P> = {
  [K in keyof ExcludeEmitters<P>]: ExcludeEmitters<P>[K];
} & Emitters<{
  [K in keyof IncludeEmitters<P>]: IncludeEmitters<P>[K] extends
    | EventEmitter<infer E>
    | undefined
    ? E
    : never;
}>;

type ExcludeEmitters<T> = Pick<
  T,
  {
    [K in keyof T]: T[K] extends EventEmitter<any> | undefined ? never : K;
  }[keyof T]
>;
type IncludeEmitters<T> = Pick<
  T,
  {
    [K in keyof T]: T[K] extends EventEmitter<any> | undefined ? K : never;
  }[keyof T]
>;

export type Emitters<T> = {
  [Key in keyof T as `on:${string & Key}`]?: (value: T[Key]) => void;
};
