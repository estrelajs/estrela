import { defineElement, FE, html, setProperties, state } from '../../revange';

const Counter: FE = () => {
  const count = state<number>();
  setProperties({ props: { count } });
  return () => html`<div>Count is ${count}</div>`;
};

const App: FE = () => {
  const count = state(0);

  // current value
  console.log(count());

  // value updater
  setInterval(() => count.update(value => ++value), 1000);

  // value subscription
  count.subscribe(console.log);

  return () => html`<app-counter :count=${count()}></app-counter>`;
};

defineElement('app-counter', Counter);
defineElement('app-root', App);
