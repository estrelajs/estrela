import { html, render } from './lib';

const App = (name: string, visible?: boolean) => {
  return html`
    <h1>Hello, ${name}!</h1>
    ${visible && html`<app-element></app-element>`}
    <app-element></app-element>
  `;
};

render(App('world'), document.body);
