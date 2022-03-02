import { asyncRender, html, render, when } from '@estrela';
import './style.css';

const deferedTemplate = new Promise(r => setTimeout(r, 2000)).then(
  () => html`<div>Hello World!</div>`
);

render(
  html`
    ${when(true, '<h1>Welcome!</h1>')}
    ${asyncRender(deferedTemplate, '<div>Loading...</div>')}
  `,
  document.getElementById('app')!
);
