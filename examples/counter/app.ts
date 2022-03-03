import {
  asyncRender,
  defineElement,
  asyncMap,
  Fel,
  html,
  setProperties,
  state,
  when,
  switchRender,
  on,
  onDefault,
} from '@estrela';
import { defer, map, startWith } from 'rxjs';

const Counter: Fel = () => {
  const count = state<number>(0);
  setProperties({ props: { count } });

  const doubleCount$ = defer(() =>
    count.pipe(
      startWith(count()),
      map(value => value * 2)
    )
  );

  const data = new Promise<number[]>(resolve =>
    setTimeout(() => resolve(Array.from({ length: 10 }).map((_, i) => i)), 3000)
  );

  return () => html`
    <div>Count is ${asyncRender(doubleCount$)}</div>
    <div>${when(count() * 2 < 10, 'Counting until 10...', 'Finished!')}</div>
    <ul>
      ${asyncMap(data, item => html`<li>${item}</li>`, html`<li>Loading...</li>`)}
    </ul>
    <div>
      ${switchRender(
        count(),
        on(0, html`<span>Zero</span>`),
        on(1, html`<span>One</span>`),
        on(2, html`<span>Two</span>`),
        on(3, html`<span>Three</span>`),
        on(4, html`<span>Four</span>`),
        on(5, html`<span>Five</span>`),
        onDefault(html`<span>Others</span>`)
      )}
    </div>
  `;
};

const App: Fel = () => {
  const count = state(1);

  // value updater
  setInterval(() => count.update(value => ++value), 1000);

  return () => html`<app-counter :count=${count()}></app-counter>`;
};

defineElement('app-counter', Counter);
defineElement('app-root', App);