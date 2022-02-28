import { defineElement, FE, html, prop, setProperties, state } from '../../revange'

const Counter: FE = () => {
  const count = prop<number>()
  setProperties({ props: { count } })
  return () => html`<div>Count is ${count}</div>`
}

const App: FE = () => {
  const count = state(0)

  // current value
  console.log(count())

  // value updater
  setInterval(() => count.update(value => ++value), 1000)

  // value subscription
  count.subscribe(console.log)

  const click = Array.from({ length: 10 }).map(
    (_, i) => () => console.log(`clicked on n${i}`)
  )

  return () =>
    html`
      <app-counter :count=${count()}></app-counter>
      <button on:click=${click[count() % 10]}>Click me!</button>
    `
}

defineElement('app-counter', Counter)
defineElement('app-root', App)
