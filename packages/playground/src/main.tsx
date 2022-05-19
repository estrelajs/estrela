import { createState, render } from 'estrela';

/**
 * Replicate the list of items example from SolidJs Playground
 * https://playground.solidjs.com/?hash=1811937776&version=1.3.16
 */

// function App() {
const list = createState<number[]>([1]);
let i = 2;

const template = (
  <>
    <h1>List Example</h1>
    <button on:click={() => list.update(list => [...list, i++])}>
      Add Item
    </button>
    <button on:click={() => list.update(list => [i++, ...list.slice(1)])}>
      Change First Item
    </button>
    <ul>{() => list.$.map(i => <Item i={i} />)}</ul>
  </>
);
// }

function Item({ i }: { i: number }) {
  const random = Math.random();
  console.log('Called Item');
  return (
    <li>
      {i}: {random}
    </li>
  );
}

render(template, document.getElementById('app')!);
