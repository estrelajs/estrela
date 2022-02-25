import { defineElement, FE, html, state } from '../revange'
import { Result } from './result'

const GITHUB_API = '//api.github.com/search/repositories'

// App "component"
export const App: FE = setProperties => {
  const results = state<any[]>([])

  setProperties({
    states: {
      results,
    },
  })

  // fetch data and initial render template
  fetch(`${GITHUB_API}?q=akita`)
    .then(r => r.json())
    .then(json => json?.items ?? [])
    .then(result => results.next(result))

  // onRemove: update results and render again
  const onRemove = (result: any) => {
    results.update(results => results.filter(item => item !== result))
  }

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
