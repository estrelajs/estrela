import { html, render, state } from '@estrela';
import { Result } from './result';

const GITHUB_API = '//api.github.com/search/repositories';
const results = state([] as any[]);

// onRemove: update results and render again
const onRemove = (result: any) => {
  results.update(results => results.filter(item => item !== result));
};

// App "component"
export const App = (results: any[]) => html`
  <div>
    <h1>Example</h1>
    <div class="list">${results.map(result => Result({ result, onRemove }))}</div>
  </div>
`;

// fetch data and initial render template
fetch(`${GITHUB_API}?q=estrela`)
  .then(r => r.json())
  .then(json => json?.items ?? [])
  .then(result => results.next(result));

// Render template on every "results" state change
results.subscribe(results => {
  render(App(results), document.getElementById('app')!);
});
