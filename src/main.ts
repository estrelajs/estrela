import { html, render, state } from './lib';

const App = (name: string) => {
  const titleClass = 'title';
  const visible = state(false);

  return html`
    <h1 class="${titleClass}">Hello, ${name}!</h1>
    <input type="checkbox" checked=${visible} />
    ${visible() && html`<app-element></app-element>`}
    <app-element></app-element>
    <input type="text" placeholder="Type something..." />
  `;
};

render(App('world'), document.body);
