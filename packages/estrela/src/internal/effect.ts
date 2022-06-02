import {
  createObservable,
  createSubscription,
  Observable,
  State,
  STATE_CALLS,
} from '../observables';

export function effect<T>(fn: () => T): Observable<T> {
  const subscription = createSubscription();
  const states: State<any>[] = [];

  return createObservable(subscriber => {
    const updater = () => {
      STATE_CALLS.clear();
      const result = fn();
      STATE_CALLS.forEach(state => {
        if (!states.includes(state)) {
          states.push(state);
          subscription.add(state.subscribe(updater));
        }
      });
      subscriber.next(result);
    };
    updater();
    return subscription;
  });
}
