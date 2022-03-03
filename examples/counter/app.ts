import {
  asyncRender,
  defineElement,
  Fel,
  html,
  setProperties,
  state,
  when,
} from '@estrela';
import { defer, map, startWith } from 'rxjs';

const Counter: Fel = () => {
  const count = state<number>(0);
  setProperties({ props: { count } });

  const doubleCount$ = defer(() =>
    count.pipe(
      startWith(count()),
      map(value => value * 2)
    )
  );

  return () => html`
    <div>Count is ${asyncRender(doubleCount$)}</div>
    <div>${when(count() * 2 < 10, 'Counting until 10...', 'Finished!')}</div>
  `;
};

const App: Fel = () => {
  const count = state(1);

  // value updater
  setInterval(() => count.update(value => ++value), 1000);

  return () => html`<app-counter :count=${count()}></app-counter>`;
};

defineElement('app-counter', Counter);
defineElement('app-root', App);
