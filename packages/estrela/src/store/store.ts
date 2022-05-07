import {
  coerceObserver,
  createSubscriber,
  createSubscription,
  ObservableLike,
  Observer,
} from '../observables';
import { symbol_observable } from '../observables/symbol';

export interface Store<S extends Object> extends ObservableLike<S> {
  /** Get the current state. */
  getState(): Readonly<S>;

  /**
   * Update the state with the updater callback.
   * @param updater callback function to update current state.
   */
  update(updater: (state: Readonly<S>) => S): void;
}

export function createStore<S extends Object>(initialState: S): Store<S> {
  let value = Object.freeze(initialState ?? {});
  const observers = new Set<Observer<any>>();
  const subscriber = createSubscriber(observers);

  return {
    [symbol_observable]() {
      return this;
    },
    getState() {
      return value;
    },
    subscribe(observer: any) {
      const obs = coerceObserver(observer);
      observers.add(obs);
      obs.next(value);
      return createSubscription(() => observers.delete(obs));
    },
    update(setter: (value: any) => any) {
      value = Object.freeze(setter(value));
      subscriber.next(value);
    },
  };
}
