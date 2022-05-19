import { createProxyState } from 'estrela/internal';
import classes from './App.module.css';

function App() {
  const state = createProxyState({
    items: [] as number[],
    showOdds: true,
  });

  let counter = 0;

  function appendItem() {
    state.items = [...state.items, ++counter];
  }

  function prependItem() {
    state.items = [++counter, ...state.items];
  }

  function removeItem() {
    state.items = state.items.slice(0, -1);
  }

  function shuffleList() {
    state.items = state.items.sort(() => Math.random() - 0.5).slice();
  }

  function toggleOdds() {
    state.showOdds = !state.showOdds;
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
          {() => (state.showOdds ? 'Hide' : 'Show')} odds
        </button>
        <button on:click={() => console.log(state.items)}>Log</button>
      </div>

      <ul class="list" class:has-item={() => state.items.length}>
        <li>Header</li>

        {() =>
          state.items.map(item => {
            const klass = item % 2 === 0 ? 'even' : 'odd';
            return state.showOdds || klass === 'even' ? (
              <li key={item} class={classes[klass]}>
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

export default App;
