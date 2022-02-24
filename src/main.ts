import { html, render } from './revange'
// import { html, render } from 'lit-html'
import './style.css'

let count = 0
const countTemplate = () => html`
  <h5>Hello ${'World'}!</h5>
  <div>Count is ${count++}</div>
  <button on:click=${() => (count = 0)}>Reset!</button>
`

const update = () => render(countTemplate(), document.getElementById('app')!)
// setInterval(update, 1000)
update()
