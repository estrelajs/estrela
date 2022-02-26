import { defineElement, FE, html, state } from '../../revange'

const App: FE = () => {
  const count = state(0)

  setInterval(() => count.update(value => ++value), 1000)

  return () => html`<div>Count is ${count}</div>`
}

defineElement('app-root', App)
