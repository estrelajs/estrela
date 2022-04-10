import { Component, styled, observable, state } from './lib';
import { async } from './lib/directives';
import { html, render } from './lib/dom';

interface RamdomProps {
  ms: number;
}

const Random: Component<RamdomProps> = ({ ms }) => {
  const random = state(Math.random());

  const list$ = observable<string[]>(subscriber =>
    setTimeout(() => {
      subscriber.next(['a', 'b', 'c']);
      subscriber.complete();
    }, ms())
  );

  return html`
    <div>Random is ${random}</div>
    <ul>
      ${() =>
        async(list$)?.map(item => html`<li>${item}</li>`) ??
        html`<li>Loading...</li>`}
    </ul>
  `;
};

interface CounterProps {
  count: number;
}

const Counter: Component<CounterProps> = ({ count }) => {
  return html`
    <h3>Counter</h3>
    <div>Count is ${count}</div>
  `;
};

const App: Component = () => {
  const count = state(0);
  const visible = state(true);

  setInterval(() => count.update(v => v + 1), 1000);

  return html`
    <h1 class="greet">Hello World</h1>
    <p>This is a simple example of a component</p>
    <input
      id="toggle"
      type="checkbox"
      checked=${visible}
      onchange=${() => visible.update(v => !v)}
    />
    <label for="toggle">Show counter</label>
    ${() => visible() && html`<${Random} ms=${1000} />`}
    <${Random} ms=${2000} />
    <${Counter} count=${count} />
  `;
};

styled(App)/* css */ `
  .greet {
    color: red;
  }
`;

render(html`<${App} />`, document.getElementById('app')!);
