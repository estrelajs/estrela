import { Component, html, render, state } from './lib';

interface CounterProps {
  count: number;
}

const Counter: Component<CounterProps> = ({ count }) => {
  return html`<div>Count is ${count}</div>`;
};

const Random: Component = () => {
  const random = state(Math.random());
  return html`<div>Random is ${random}</div>`;
};

const App: Component = () => {
  const name = 'world';
  const titleClass = 'title';
  const count = state(0);
  const visible = state(false);

  // any kind of side effect, no `useEffect` needed.
  setInterval(() => count.update(v => v + 1), 1000);

  return html`
    <h1 class="${titleClass}">Hello, ${name}!</h1>

    <input
      id="toggle"
      type="checkbox"
      checked=${visible}
      onchange=${() => visible.update(v => !v)}
    />
    <label for="toggle">Show first random number</label>

    ${() => visible() && html`<${Random} />`}
    <${Random} />

    <${Counter} count=${count} />
  `;
};

render(html`<${App} />`, document.getElementById('app')!);
