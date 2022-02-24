import { Result } from './result'
import { html, render } from './revange'

const SEARCH = '//api.github.com/search/repositories'

const state = {
  results: [],
}

// ${until(
//   fetchRepos().then(results =>
//     results.map(result => Result({ result, onRemove: handleRemove }))
//   ),
//   html`<div>Loading...</div>`
// )}

export const App = () => html`
  <div>
    <h1>Example</h1>
    <div class="list">
      ${state.results.map(result => Result({ result, onRemove }))}
    </div>
  </div>
`

const onRemove = (result: any) => {
  const newResults = state.results.filter(item => item !== result)
  state.results = newResults
  render(App(), document.getElementById('app')!)
}

const fetchRepos = () =>
  fetch(`${SEARCH}?q=preact`)
    .then(r => r.json())
    .then(json => (json && json.items) || [])
    .then(result => {
      state.results = result
      return state.results
    })

fetchRepos().then(() => {
  render(App(), document.getElementById('app')!)
})
