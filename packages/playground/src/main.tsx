import { createState, render } from 'estrela';

function App() {
  const items = createState<number[]>([]);
  const showOdds = createState(true);
  let counter = 0;

  function appendItem() {
    items.update(items => [...items, ++counter]);
  }

  function prependItem() {
    items.update(items => [++counter, ...items]);
  }

  function removeItem() {
    items.update(items => items.slice(0, -1));
  }

  function shuffleList() {
    items.update(items => items.sort(() => Math.random() - 0.5).slice());
  }

  function toggleOdds() {
    showOdds.update(showOdds => !showOdds);
  }

  return (
    <>
      <h1 style:color="red">Children Test</h1>

      <div class="actions">
        <button on:click={appendItem}>Append item</button>
        <button on:click={prependItem}>Prepend item</button>
        <button on:click={removeItem}>Remove item</button>
        <button on:click={shuffleList}>Shuffle list</button>
        <button on:click={toggleOdds}>
          {showOdds.$ ? 'Hide' : 'Show'} odds
        </button>
        <button on:click={() => console.log(items.$)}>Log</button>
      </div>

      <ul class="list" class:has-item={items.$.length}>
        <li>Header</li>

        {() =>
          items.$.map(item => {
            const klass = item % 2 === 0 ? 'even' : 'odd';
            return showOdds || klass === 'even' ? (
              <li key={item} class={klass}>
                Item {item}
              </li>
            ) : null;
          })
        }

        <li>Footer</li>
      </ul>
    </>
  );
}

render(<App />, document.getElementById('app')!);
