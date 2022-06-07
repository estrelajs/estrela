import { render } from 'estrela';

function Row(props: { id: number }) {
  const random = Math.random();
  return (
    <li class="item">
      {() => props.id} - {random}
    </li>
  );
}

function App() {
  let list: number[] = [];
  var nextId = 1;

  return (
    <div>
      <h1>Hello World!</h1>
      <div>
        <button on:click={() => (list = [...list, nextId++])}>Add</button>
        <button on:click={() => (list = list.slice(1))}>Remove first</button>
        <button on:click={() => (list = list.slice(0, -1))}>Remove last</button>
        <button on:click={() => (list = list.reverse().slice())}>Suffle</button>
      </div>
      <ul>
        <li>Header</li>
        {list.map(id => (
          <Row key={id} id={id} />
        ))}
        <li>Footer</li>
      </ul>
    </div>
  );
}

render(<App />, document.getElementById('app')!);
