import { hAsync, hIf, html, render } from './revange';
import './style.css';

const promise = new Promise(r => setTimeout(r, 2000)).then(
  () => html`<div>Hello World!</div>`
);

render(
  html`
    ${hIf(true, '<h1>Welcome!</h1>')} ${hAsync(promise, html`<div>Loading...</div>`)}
  `,
  document.getElementById('app')!
);
