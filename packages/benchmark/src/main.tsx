import { Output, signal } from 'estrela';

interface RowData {
  id: number;
  label: string;
}

const A = [
  'pretty',
  'large',
  'big',
  'small',
  'tall',
  'short',
  'long',
  'handsome',
  'plain',
  'quaint',
  'clean',
  'elegant',
  'easy',
  'angry',
  'crazy',
  'helpful',
  'mushy',
  'odd',
  'unsightly',
  'adorable',
  'important',
  'inexpensive',
  'cheap',
  'expensive',
  'fancy',
];
const C = [
  'red',
  'yellow',
  'blue',
  'green',
  'pink',
  'brown',
  'purple',
  'brown',
  'white',
  'black',
  'orange',
];
const N = [
  'table',
  'chair',
  'house',
  'bbq',
  'desk',
  'car',
  'pony',
  'cookie',
  'sandwich',
  'burger',
  'pizza',
  'mouse',
  'keyboard',
];

let nextId = 1;
const random = (max: number) => Math.round(Math.random() * 1000) % max;
const buildData = (count: number) => {
  const data: RowData[] = new Array(count);

  for (let i = 0; i < count; i++) {
    data[i] = {
      id: nextId++,
      label: `${A[random(A.length)]} ${C[random(C.length)]} ${
        N[random(N.length)]
      }`,
    };
  }

  return data;
};

const data = signal<RowData[]>([]);
const selected = signal(0);
const version = '0.11.0';

const actions = {
  run: () => {
    data.set(buildData(1000));
    selected.set(0);
  },
  runLots: () => {
    data.set(buildData(10000));
    selected.set(0);
  },
  add: () => {
    data.update(data => data.concat(buildData(1000)));
  },
  update: () => {
    data.mutate(data => {
      for (let i = 0; i < data.length; i += 10) {
        const r = data[i];
        data[i] = { id: r.id, label: r.label + ' !!!' };
      }
    });
  },
  clear: () => {
    data.set([]);
    selected.set(0);
  },
  swapRows: () => {
    if (data().length > 998) {
      data.update(data => [
        data[0],
        data[998],
        ...data.slice(2, 998),
        data[1],
        data[999],
      ]);
    }
  },
  remove: (id: number) => {
    data.update(data => {
      const idx = data.findIndex(d => d.id === id);
      return [...data.slice(0, idx), ...data.slice(idx + 1)];
    });
  },
  select: (id: number) => {
    selected.set(id);
  },
};

function Row(this: { item: RowData }) {
  return (
    <tr class={selected() === this.item.id ? 'danger' : ''}>
      <td class="col-md-1">{this.item.id}</td>
      <td class="col-md-4">
        <a on:click={() => actions.select(this.item.id)}>{this.item.label}</a>
      </td>
      <td class="col-md-1">
        <a on:click={() => actions.remove(this.item.id)}>
          <span class="glyphicon glyphicon-remove" aria-hidden="true" />
        </a>
      </td>
      <td class="col-md-6" />
    </tr>
  );
}

function Button(this: { id: string; title: string; click: Output<void> }) {
  return (
    <div class="col-sm-6 smallpad">
      <button
        type="button"
        class="btn btn-primary btn-block"
        id={this.id}
        on:click={() => this.click()}
      >
        {this.title}
      </button>
    </div>
  );
}

function Jumbotron() {
  return (
    <div class="jumbotron">
      <div class="row">
        <div class="col-md-6">
          <h1>Estrela v{version} keyed</h1>
        </div>
        <div class="col-md-6">
          <div class="row">
            <Button
              id="run"
              title="Create 1,000 rows"
              on:click={() => actions.run()}
            />
            <Button
              id="runlots"
              title="Create 10,000 rows"
              on:click={() => actions.runLots()}
            />
            <Button
              id="add"
              title="Append 1,000 rows"
              on:click={() => actions.add()}
            />
            <Button
              id="update"
              title="Update every 10th row"
              on:click={() => actions.update()}
            />
            <Button id="clear" title="Clear" on:click={() => actions.clear()} />
            <Button
              id="swaprows"
              title="Swap Rows"
              on:click={() => actions.swapRows()}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Main() {
  return (
    <div class="container">
      <Jumbotron />
      <table class="table table-hover table-striped test-data">
        <tbody>
          {data().map(item => (
            <Row key={item.id} item={item} />
          ))}
        </tbody>
      </table>
      <span class="preloadicon glyphicon glyphicon-remove" aria-hidden="true" />
    </div>
  );
}

(<Main />).mount(document.getElementById('main')!);
