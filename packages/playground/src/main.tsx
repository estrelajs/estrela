import { createStateProxy, render } from 'estrela';

// function Row(props: { id: number }) {
//   const random = Math.random();
//   return (
//     <li class="item">
//       {() => props.id} - {random}
//     </li>
//   );
// }

// const StyledRow = styled(Row)`
//   .item {
//     background-color: red;
//   }
// `;

// function App(props: { ref?: { test: string } }) {
//   const divRef = createState<HTMLDivElement>();
//   let list: number[] = [];
//   let nextId = 1;

//   divRef.subscribe(console.log);
//   props.ref = { test: 'test' };

//   return (
//     <div>
//       <h1 style={{ backgroundColor: nextId > 5 ? 'red' : '' }}>Hello World!</h1>
//       <div ref={divRef}>
//         <button on:click={() => (list = [...list, nextId++])}>Add</button>
//         <button on:click={() => (list = list.slice(1))}>Remove first</button>
//         <button on:click={() => (list = list.slice(0, -1))}>Remove last</button>
//         <button on:click={() => (list = list.reverse().slice())}>Suffle</button>
//       </div>
//       <ul>
//         <li>Header</li>
//         {list.map(id => (
//           <StyledRow key={id} id={id} />
//         ))}
//         <li>Footer</li>
//       </ul>
//     </div>
//   );
// }

function App(props: { log: (value: any) => void }) {
  const state = createStateProxy({
    text: 'test',
    number: 0,
    date: new Date(),
    checked: false,
    radio: 'apple',
    select: 'apple',
  });

  return (
    <>
      <h1 ref={props.log} on:click={() => props.log('click')}>
        Forms Test
      </h1>
      <form>
        <div>
          <label>Input: </label>
          <input type="text" bind={state.$.text} />
        </div>
        <div>Output: "{state.text}"</div>

        <br />

        <div>
          <label>Input: </label>
          <input type="number" bind={state.$.number} />
        </div>
        <div>Output: {state.number}</div>

        <br />

        <div>
          <label>Input: </label>
          <input type="date" bind={state.$.date} />
        </div>
        <div>Output: {state.date}</div>

        <br />

        <div>
          <label>Input: </label>
          <input type="checkbox" bind={state.$.checked} />
        </div>
        <div>Output: {state.checked ? 'True' : 'False'}</div>

        <br />

        <div>
          <label>Input: </label>
          <input id="apple" type="radio" bind={state.$.radio} value="apple" />
          <label for="apple">Apple</label>
          <input id="orange" type="radio" bind={state.$.radio} value="orange" />
          <label for="orange">Orange</label>
          <input id="banana" type="radio" bind={state.$.radio} value="banana" />
          <label for="banana">Banana</label>
        </div>
        <div>Output: "{state.radio}"</div>

        <br />

        <div>
          <label>Input: </label>
          <select bind={state.$.select}>
            <option value="apple">Apple</option>
            <option value="orange">Orange</option>
            <option value="banana">Banana</option>
          </select>
        </div>
        <div>Output: "{state.select}"</div>
      </form>
    </>
  );
}

render(<App log={console.log} />, document.getElementById('app')!);
