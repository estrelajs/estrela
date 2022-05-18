import { createState, render } from 'estrela';

function App() {
  const count = createState(0);
  const tags: Record<number, JSX.Element> = {
    0: (
      <button
        style:color={() => 'red'}
        on:click={() => {
          count.update(count => count + 1);
          console.log('1');
        }}
      >
        <span>Hello world</span>
      </button>
    ),
    1: (
      <button
        style:color={() => 'blue'}
        on:click={() => {
          count.update(count => count + 1);
          console.log('2');
        }}
      >
        <span>Hello world</span>
      </button>
    ),
    2: (
      <button
        on:click={() => {
          count.update(count => count + 1);
          console.log('3');
        }}
      >
        <h1>This is it!</h1>
      </button>
    ),
  };

  return <>{() => tags[count.$ % 3]}</>;
}

render(<App />, document.getElementById('app')!);
