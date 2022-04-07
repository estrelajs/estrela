import { html, render, state } from './lib';

function Counter1({ text, count }: any) {
  return html`
    <div>${text} is ${count}</div>
    <div>${text} is ${count}</div>
  `;
}

function Counter2({ text, count }: any) {
  return html`
    <div>${text} is ${count}</div>
    <div>${text} is ${count}</div>
  `;
}

let count = -1;

function App() {
  const name = 'world';
  const titleClass = 'title';
  const visible = state(false);
  count++;

  return html`
    <h1>Hello World!</h1>
    ${count % 2 === 0
      ? html`<${Counter1} text="Counter 1" count=${count} />`
      : ''}
    <${Counter2} text="Counter 2" count=${count} />
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
