import { createObservable, createState, render } from 'estrela';

const timer = createObservable<JSX.Element>(subscriber => {
  let count = 0;

  const next = () => {
    const minutes = String(Math.floor(count / 60)).padStart(2, '0');
    const seconds = String(count % 60).padStart(2, '0');
    subscriber.next(
      <span>
        {minutes}:{seconds}
      </span>
    );
  };
  next();

  const interval = setInterval(() => {
    count++;
    next();
  }, 1000);

  return () => clearInterval(interval);
});

const fruits = createState<string[]>([]);

function Row(props: { id: number; label: string }) {
  return (
    <tr>
      <td>{() => props.id}</td>
      <td>{() => props.label}</td>
    </tr>
  );
}

function App() {
  return (
    <div>
      {/* <h1>Hello World!</h1>
      <div>⏱️ {timer}</div>
      <p>This is a simple example of a Estrela component</p> */}
      <div class="button">
        <button on:click={() => fruits.update(list => [...list, 'apple'])}>
          Add fruit
        </button>
        <button on:click={() => fruits.update(list => list.slice(0, -1))}>
          Remove fruit
        </button>
        <button on:click={() => fruits.next(Array(1000).fill('apple'))}>
          Set 1,000 fruits
        </button>
      </div>
      <table>
        <tbody>
          <Row id={0} label="Header" />
          {() => fruits.$.map((fruit, i) => <Row id={i + 1} label={fruit} />)}
          <Row id={-1} label="footer" />
        </tbody>
      </table>
    </div>
  );
}

render(<App />, document.getElementById('app')!);
