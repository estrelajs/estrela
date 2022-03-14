import { defineElement, Fel, html, state, prop, onEvent } from '@estrela';
import {
  asyncRender,
  asyncMap,
  when,
  switchRender,
  onCase,
  onDefault,
} from '@estrela/directives';
import { defer, map, startWith } from 'rxjs';

const Counter: Fel = () => {
  const count = prop<number>();

  const doubleCount$ = defer(() =>
    count.pipe(
      startWith(count()),
      map(value => (value ?? 0) * 2)
    )
  );

  const data = new Promise<number[]>(resolve =>
    setTimeout(() => resolve(Array.from({ length: 10 }).map((_, i) => i)), 3000)
  );

  onEvent('init').subscribe(() => {
    console.log('init');
  });

  return () => html`
    <div>Count is ${asyncRender(doubleCount$)}</div>
    <div>${when((count() ?? 0) * 2 < 10, 'Counting until 10...', 'Finished!')}</div>
    <ul>
      ${asyncMap(data, item => html`<li>${item}</li>`, html`<li>Loading...</li>`)}
    </ul>
    <div>
      ${switchRender(
        count(),
        onCase(0, html`<span>Zero</span>`),
        onCase(1, html`<span>One</span>`),
        onCase(2, html`<span>Two</span>`),
        onCase(3, html`<span>Three</span>`),
        onCase(4, html`<span>Four</span>`),
        onCase(5, html`<span>Five</span>`),
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
