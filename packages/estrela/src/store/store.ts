import { signal } from '../signal';
import { ReadonlySignal } from '../types';
import { SignalStoreFeature } from './feature';

type UnionToIntersection<U> = (
  U extends unknown ? (k: U) => void : never
) extends (k: infer I) => void
  ? I
  : never;

export type SignalStoreState<Args extends SignalStoreFeature[]> =
  UnionToIntersection<
    Args[number] extends SignalStoreFeature ? Args[number]['state'] : never
  >;

export type SignalStore<T> = {
  [K in keyof T]: ReadonlySignal<T[K]>;
};

/** Creates a Signal Store. */
export function signalStore<
  Args extends SignalStoreFeature[],
  State extends SignalStoreState<Args>
>(...args: Args): [SignalStore<State>, (fn: (value: State) => State) => void] {
  const initialState = {} as State;
  const storeSignal = signal({} as State);
  const store = {} as SignalStore<State>;
  const update = (fn: (value: State) => State) => {
    storeSignal.update(fn);
  };

  for (const feature of args) {
    if (feature.state) {
      Object.assign(initialState as State & {}, feature.state);
    }
  }

  update(() => initialState);
  for (const key in initialState) {
    store[key] = () => storeSignal()[key];
  }

  return [store, update];
}
