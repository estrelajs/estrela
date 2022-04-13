import { state, styled } from '../lib';
import { html } from '../lib/dom';
import Counter from './Counter';
import Random from './Random';

const App = styled(() => {
  const count = state(0);
  const visible = state(true);

  setInterval(() => count.update(v => v + 1), 1000);

  return html`
    <h1 class="title">Hello World</h1>
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
})/* css */ `
  .title {
    color: red;
  }
`;

export default App;
