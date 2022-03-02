import { defineElement, Fel, html, setProperties, state } from '@estrela';

const Counter: Fel = () => {
  const count = state<number>();

  // value subscription
  count.subscribe(console.log);
  setProperties({ props: { count } });
  return () => html`<div>Count is ${count}</div>`;
};

const App: Fel = () => {
  const count = state(0);

  // current value
  console.log(count());

  // value updater
  setInterval(() => count.update(value => ++value), 1000);

  return () => html`<app-counter :count=${count()}></app-counter>`;
};

defineElement('app-counter', Counter);
defineElement('app-root', App);
