import { Observable, State, STATE_CALLS, Subscription } from '../observables';

export function effect<T>(fn: () => T): Observable<T> {
  return new Observable(subscriber => {
    const subscription = new Subscription();
    const states: State<any>[] = [];
    const effectSync = () => {
      STATE_CALLS.clear();
      const result = fn();
      STATE_CALLS.forEach(state => {
        if (!states.includes(state)) {
          states.push(state);
          subscription.add(state.subscribe(effectSync));
        }
      });
      subscriber.next(result);
    };
    effectSync();
    return subscription;
  });
}
