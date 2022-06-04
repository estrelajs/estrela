import { createState, EventEmitter, render } from 'estrela';
import { h, template } from 'estrela/internal';

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

const data = createState<RowData[]>([]);
const selected = createState(0);
const version = '0.10.0';

const actions = {
  run: () => {
    data.next(buildData(1000));
    selected.next(0);
  },
  runLots: () => {
    data.next(buildData(10000));
    selected.next(0);
  },
  add: () => {
    data.update(items => items.concat(buildData(1000)));
  },
  update: () =>
    data.update(items => {
      const newData = items.slice(0);
      for (let i = 0; i < newData.length; i += 10) {
        const r = newData[i];
        newData[i] = { id: r.id, label: r.label + ' !!!' };
      }
      return newData;
    }),
  clear: () => {
    data.next([]);
    selected.next(0);
  },
  swapRows: () => {
    if (data.$.length > 998) {
      data.update(items => [
        items[0],
        items[998],
        ...items.slice(2, 998),
        items[1],
        items[999],
      ]);
    }
  },
  remove: (id: number) => {
    data.update(items => {
      const idx = items.findIndex(d => d.id === id);
      return [...items.slice(0, idx), ...items.slice(idx + 1)];
    });
  },
  select: (id: number) => {
    selected.next(id);
  },
};

const Row_tmpl = template(
  '<tr><td class="col-md-1"></td><td class="col-md-4"><a></a></td><td class="col-md-1"><a><span class="glyphicon glyphicon-remove" aria-hidden="true" /></a></td><td class="col-md-6" /></tr>'
);
// return (
//   <tr class:danger={() => selected.$ === props.item.id}>
//     <td class="col-md-1">{() => props.item.id}</td>
//     <td class="col-md-4">
//       <a on:click={() => actions.select(props.item.id)}>
//         {() => props.item.label}
//       </a>
//     </td>
//     <td class="col-md-1">
//       <a on:click={() => actions.remove(props.item.id)}>
//         <span class="glyphicon glyphicon-remove" aria-hidden="true" />
//       </a>
//     </td>
//     <td class="col-md-6" />
//   </tr>
// );
const Row = (props: { item: RowData }) =>
  h(Row_tmpl, {
    0: { class: () => (selected.$ === props.item.id ? 'danger' : false) },
    1: { children: [[() => props.item.id]] },
    3: {
      children: [[() => props.item.label]],
      'on:click': () => actions.select(props.item.id),
    },
    5: { 'on:click': () => actions.remove(props.item.id) },
  });

const Button_tmpl = template(
  '<div class="col-sm-6 smallpad"><button type="button" class="btn btn-primary btn-block"></button></div>'
);
// return (
//   <div class="col-sm-6 smallpad">
//     <button
//       type="button"
//       class="btn btn-primary btn-block"
//       id={() => props.id}
//       on:click={() => props.click.emit()}
//     >
//       {() => props.title}
//     </button>
//   </div>
// );
const Button = (props: {
  id: string;
  title: string;
  click: EventEmitter<void>;
}) =>
  h(Button_tmpl, {
    1: {
      id: () => props.id,
      'on:click': () => props.click.emit(),
      children: [[() => props.title]],
    },
  });

const Jumbotron_tmpl = template(
  '<div class="jumbotron"><div class="row"><div class="col-md-6"><h1>Estrela v<!> keyed</h1></div><div class="col-md-6"><div class="row"></div></div></div></div>'
);
// return (
//   <div class="jumbotron">
//     <div class="row">
//       <div class="col-md-6">
//         <h1>Estrela Hooks keyed</h1>
//       </div>
//       <div class="col-md-6">
//         <div class="row">
//           <Button
//             id="run"
//             title="Create 1,000 rows"
//             on:click={() => actions.run()}
//           />
//           <Button
//             id="runlots"
//             title="Create 10,000 rows"
//             on:click={() => actions.runLots()}
//           />
//           <Button
//             id="add"
//             title="Append 1,000 rows"
//             on:click={() => actions.add()}
//           />
//           <Button
//             id="update"
//             title="Update every 10th row"
//             on:click={() => actions.update()}
//           />
//           <Button id="clear" title="Clear" on:click={() => actions.clear()} />
//           <Button
//             id="swaprows"
//             title="Swap Rows"
//             on:click={() => actions.swapRows()}
//           />
//         </div>
//       </div>
//     </div>
//   </div>
// );
const Jumbotron = () =>
  h(Jumbotron_tmpl, {
    3: { children: [[version, 5]] },
    8: {
      children: [
        [
          h(Button, {
            id: 'run',
            title: 'Create 1,000 rows',
            'on:click': () => actions.run(),
          }),
        ],
        [
          h(Button, {
            id: 'runlots',
            title: 'Create 10,000 rows',
            'on:click': () => actions.runLots(),
          }),
        ],
        [
          h(Button, {
            id: 'add',
            title: 'Append 1,000 rows',
            'on:click': () => actions.add(),
          }),
        ],
        [
          h(Button, {
            id: 'update',
            title: 'Update every 10th row',
            'on:click': () => actions.update(),
          }),
        ],
        [
          h(Button, {
            id: 'clear',
            title: 'Clear',
            'on:click': () => actions.clear(),
          }),
        ],
        [
          h(Button, {
            id: 'swaprows',
            title: 'Swap Rows',
            'on:click': () => actions.swapRows(),
          }),
        ],
      ],
    },
  });

const Main_tmpl = template(
  '<div class="container"><table class="table table-hover table-striped test-data"><tbody></tbody></table><span class="preloadicon glyphicon glyphicon-remove" aria-hidden="true" /></div>'
);
// return (
//   <div class="container">
//     <Jumbotron />
//     <table class="table table-hover table-striped test-data">
//       <tbody>
//         {() => data.$.map(item => <Row key={item.id} item={item} />)}
//       </tbody>
//     </table>
//     <span class="preloadicon glyphicon glyphicon-remove" aria-hidden="true" />
//   </div>
// );
const Main = () =>
  h(Main_tmpl, {
    0: {
      children: [[h(Jumbotron, {}), 1]],
    },
    2: {
      children: [[() => data.$.map(item => h(Row, { item }, item.id))]],
    },
  });

render(h(Main, {}), document.getElementById('main')!);
