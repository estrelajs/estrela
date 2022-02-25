import { defineElement, FE, html, setProperties, state } from '../revange'
import { Result } from './result'

const GITHUB_API = '//api.github.com/search/repositories'

const App: FE = () => {
  const results = state<any[]>([])

  // fetch data and initial render template
  fetch(`${GITHUB_API}?q=akita`)
    .then(r => r.json())
    .then(json => json?.items ?? [])
    .then(result => results.next(result))

  // onRemove: update results and render again
  const onRemove = (result: any) => {
    results.update(results => results.filter(item => item !== result))
  }

  // will cleanup subscriptions on component discard
  const cleanup = results.subscribe(results => console.log(results))

  setProperties({
    states: [results],
    subscription: cleanup,
  })

  return () => html`
    <div>
      <h1>Example</h1>
      <div class="list">
        ${results.$.map(result => Result({ result, onRemove }))}
      </div>
    </div>

    <style>
      h1 {
        text-align: center;
      }

      .result {
        padding: 10px;
        margin: 10px;
        background: white;
        box-shadow: 0 1px 5px rgba(0, 0, 0, 0.5);
      }
    </style>
  `
}

defineElement('app-root', App)
