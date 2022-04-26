import { Component, state } from 'estrela';
import classes from './App.module.css';

const App: Component = () => {
  const items = state<number[]>([]);
  const showOdds = state(true);
  let counter = 0;

  function appendItem() {
    items.update(list => [...list, ++counter]);
  }

  function prependItem() {
    items.update(list => [++counter, ...list]);
  }

  function removeItem() {
    items.update(list => list.slice(0, -1));
  }

  function shuffleList() {
    items.update(list => list.sort(() => Math.random() - 0.5).slice());
  }

  function toggleOdds() {
    showOdds.next(!showOdds());
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
          {showOdds() ? 'Hide' : 'Show'} odds
        </button>
        <button on:click={() => console.log(items())}>Log</button>
      </div>

      <ul class="list" class:has-item={items().length}>
        <li>Header</li>

        {items().map(item => {
          const klass = item % 2 === 0 ? 'even' : 'odd';
          return showOdds() || klass === 'even' ? (
            <li key={item} class={classes[klass]}>
              Item {item}
            </li>
          ) : null;
        })}

        <li>Footer</li>
      </ul>
    </>
  );
};

export default App;
