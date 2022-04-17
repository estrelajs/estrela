import { state, styled, Show, onDestroy } from '../lib';
import { jsx } from '../lib/dom';
import Counter from './Counter';
import Random from './Random';

const App = styled(() => {
  const count = state(0);
  const visible = state(true);

  const interval = setInterval(() => count.update(v => v + 1), 1000);

  onDestroy(() => clearInterval(interval));

  return (
    <>
      <h1 class="title">Hello World</h1>
      <p>This is a simple example of a component</p>

      <div>
        <input
          id="toggle"
          type="checkbox"
          checked={visible}
          on:change={() => visible.update(v => !v)}
        />
        <label for="toggle">Show First Random</label>
      </div>

      <Show when={visible}>
        <Random ms={1000} />
        <h3 slot="else">Random Hidden</h3>
      </Show>

      <Random ms={2000} on:complete={console.log} />
      <Counter count={count} />

      <button on:click={() => count.next(0)}>Reset Counter</button>
      <input on:keydown={(e: KeyboardEvent) => console.log(e.key)} />
    </>
  );
})/* css */ `
  .title {
    color: red;
  }
`;

export default App;
