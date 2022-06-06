import { createState, render } from 'estrela';
import { h, template } from 'estrela/internal';

const _tmpl = template(
    '<div><h1>Hello World!</h1><div><button>Add</button><button>Remove first</button><button>Remove last</button><button>Suffle</button></div><ul><li>Header</li><li>Footer</li></ul></div>'
  ),
  _tmpl1 = template('<li></li>');

let nextId = 1;
const list = createState<number[]>([]);

function Row(props: { id: number }) {
  const random = Math.random();
  return h(_tmpl1, {
    0: { class: 'item', children: [[() => `${props.id} - ${random}`, null]] },
  });
}

function App() {
  return h(_tmpl, {
    4: {
      'on:click': () => list.update(items => [...items, nextId++]),
    },
    6: {
      'on:click': () => list.update(items => items.slice(1)),
    },
    8: {
      'on:click': () => list.update(items => items.slice(0, -1)),
    },
    10: {
      'on:click': () => list.update(items => items.reverse().slice()),
    },
    12: {
      children: [[() => list.$.map(id => h(Row, { id }, id)), 15]],
    },
  });
}

// const count = createState(0);
// setInterval(() => count.next(count.$ + 1), 1000);

// const _tmpl = template('<h1>Hello World!</h1><div>Count is <!>!</div>');
// function App(props: { count: number }) {
//   return h(_tmpl, {
//     0: { class: () => (props.count % 2 === 0 ? 'even' : 'odd') },
//     2: { children: [[() => props.count, 5]] },
//   });
// }

render(
  h(App, {
    /* count: () => count.$ */
  }),
  document.getElementById('app')!
);
