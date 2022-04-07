import { html, render, state } from './lib';

function Counter({ text, count }: any) {
  return html`<div>${text} is ${count}</div>`;
}

let count = 0;

function App() {
  const name = 'world';
  const titleClass = 'title';
  const visible = state(false);
  count++;

  return html`
    ${count % 2 === 0
      ? html`<${Counter} text="Counter 1" count=${count} />`
      : ''}
    <${Counter} text="Counter 2" count=${count} />
  `;

  // return html`
  //   <h1 class="${titleClass}">Hello, ${name}!</h1>
  //   <input type="checkbox" checked=${visible} />
  //   ${visible() && html`<app-element></app-element>`}
  //   <app-element></app-element>
  //   <input type="text" placeholder="Type something..." />
  //   <div>Count is ${count}</div>
  // `;
}

const appRender = () => {
  render(html`<${App} />`, document.getElementById('app')!);
};
setInterval(appRender, 1000);
appRender();
