import { css, defineElement, Fel, html, state } from 'estrela';

const GITHUB_API = '//api.github.com/search/repositories';

const App: Fel = () => {
  let loading = true;
  const results = state<any[]>([]);

  // fetch data and initial render template
  fetch(`${GITHUB_API}?q=estrela`)
    .then(r => r.json())
    .then(json => json?.items ?? [])
    .then(items => {
      loading = false;
      results.next(items);
    });

  // onRemove: update results and render again
  const onRemove = (result: any) => {
    results.update(results => results.filter(item => item !== result));
  };

  // will cleanup subscriptions on component discard
  results.subscribe(results => console.log(results));

  return () => html`
    <h1>Example</h1>
    ${loading
      ? html`<i>loading...</i>`
      : html`<div>Items: ${results().length}</div>`}
    <div class="list">
      ${results().map(
        result =>
          html`
            <app-result
              key=${result.id}
              :result=${result}
              on:remove=${onRemove}
            ></app-result>
          `
      )}
    </div>
  `;
};

defineElement(
  'app-root',
  App,
  css`
    h1 {
      text-align: center;
    }

    .list {
      display: flex;
      flex-flow: column;
    }
  `
);
