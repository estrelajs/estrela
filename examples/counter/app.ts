import {
  asyncRender,
  defineElement,
  Fel,
  html,
  setProperties,
  state,
} from '@estrela';
import { map } from 'rxjs';

const Counter: Fel = () => {
  const count = state<number>();

  setProperties({ props: { count } });

  const doubleCount$ = count.pipe(map(value => String(2 * (value ?? 0))));

  return () => html`<div>Count is ${asyncRender(doubleCount$)}</div>`;
};

const App: Fel = () => {
  const count = state(0);

  // value updater
  setInterval(() => count.update(value => ++value), 1000);

  return () => html`<app-counter :count=${count()}></app-counter>`;
};

defineElement('app-counter', Counter);
defineElement('app-root', App);
