import { createState, render } from 'estrela';
import { h, template } from 'estrela/internal';

// const _tmpl = template(
//     '<div><h1>Hello World!</h1><div><button id="add">Add</button><button id="addlot">Add 10,000</button><button id="remove">Remove</button></div><ul></ul></div>'
//   ),
//   _tmpl1 = template('<li></li>');

// const list = createState<any[]>([]);

// function Row(props: { item: string }) {
//   return h(_tmpl1, {
//     0: { class: 'item', children: [[() => props.item, null]] },
//   });
// }

// function App() {
//   return h(_tmpl, {
//     4: {
//       'on:click': () =>
//         list.update(l => Array(l.length + 1).fill(l.length + 1)),
//     },
//     6: {
//       'on:click': () =>
//         list.next(
//           Array(10000)
//             .fill(null)
//             .map((_, i) => `item ${i + 1}`)
//         ),
//     },
//     8: {
//       'on:click': () => list.update(l => l.slice(0, -1)),
//     },
//     10: {
//       children: [[() => list.$.map(item => h(Row, { item })), null]],
//     },
//   });
// }

const count = createState(0);
setInterval(() => count.next(count.$ + 1), 1000);

const _tmpl = template(
  '<div><h1>Hello World!</h1><div>Count is <!>!</div></div>'
);
const root = h(_tmpl, { 3: { children: [[() => count.$, 5]] } });

render(root, document.getElementById('app')!);
