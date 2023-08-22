import { Output, signal } from 'estrela';

function App() {
  const items = signal<string[]>([]);
  const toggle = signal(true);

  return (
    <>
      <h1>Hello Estrela!</h1>
      <button
        on:click={() =>
          items.mutate(arr => arr.unshift(String(arr.length + 1)))
        }
      >
        Add Item
      </button>
      <ul>
        {items().map(item => (
          <Item value={item} />
        ))}
      </ul>

      <button on:click={() => toggle.update(v => !v)}>Toggle</button>
      {toggle() ? (
        <Child content="A" on:click={() => console.log('Clicked on A')} />
      ) : (
        <Child content="B" on:click={() => console.log('Clicked on B')} />
      )}
    </>
  );
}

function Child(props: { content: string; click: Output<void> }) {
  const number = Math.random();
  return (
    <p on:click={() => props.click()}>
      {props.content}: {number}
    </p>
  );
}

function Item(props: { value: string }) {
  return <li>{props.value}</li>;
}

(<App />).mount(document.getElementById('app')!);
