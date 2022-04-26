import { symbol_observable } from './symbol';
import { Observer, Store } from './types';
import { coerceObserver, createSubscriber, createSubscription } from './utils';

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
