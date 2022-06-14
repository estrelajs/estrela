import { Observable, State, STATE_CALLS, Subscription } from '../observables';

export function effect<T>(fn: () => T): Observable<T> {
  return new Observable(subscriber => {
    const subscription = new Subscription();
    const states = new Set<State<any>>();
    const runEffect = () => {
      const result = fn();
      let state = STATE_CALLS.pop();
      while (state) {
        const oldSize = states.size;
        states.add(state);
        if (states.size > oldSize) {
          subscription.add(state.subscribe(runEffect));
        }
        state = STATE_CALLS.pop();
      }
      subscriber.next(result);
    };
    runEffect();
    return subscription;
  });
}
