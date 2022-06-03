import { Observable, State, STATE_CALLS, Subscription } from '../observables';

export function effect<T>(fn: () => T): Observable<T> {
  const states: State<any>[] = [];
  const subscription = new Subscription();

  return new Observable(subscriber => {
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
