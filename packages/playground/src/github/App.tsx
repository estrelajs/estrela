import { createProxyState } from 'estrela/internal';
import { debounceTime, filter, from, switchMap, tap } from 'rxjs';
import Button from './Button';
import GithubCard from './GithubCard';
import { Repositories, Repository } from './repository';

const GITHUB_API = '//api.github.com/search/repositories';

interface AppState {
  inputRef: HTMLInputElement | null;
  githubList: Repositories | undefined;
  searchQuery: string;
}

function App() {
  const state = createProxyState<AppState>({
    inputRef: null,
    githubList: [],
    searchQuery: '',
  });

  // getState(inputRef).subscribe(console.log);

  const subscription = from(state.$.searchQuery)
    .pipe(
      filter(query => query.length > 2),
      debounceTime(500),
      tap(() => (state.githubList = undefined)),
      switchMap(query =>
        fetch(`${GITHUB_API}?q=${query}`)
          .then(res => res.json())
          .then<Repositories>(json => json?.items ?? [])
      )
    )
    .subscribe(data => (state.githubList = data));

  // onDestroy(() => {
  //   subscription.unsubscribe();
  // });

  function onRemove(item: Repository): void {
    state.githubList = state.githubList?.filter(x => x !== item);
  }

  function shuffle(): void {
    state.githubList = state.githubList
      ?.sort(() => Math.random() - 0.5)
      .slice();
  }

  return (
    <>
      <h1 style:color="blue">Github Example</h1>

      <div>
        <label for="search">Search:</label>
        <input
          id="search"
          ref={ref => (state.inputRef = ref)}
          bind={state.$.searchQuery}
          placeholder="Search for github repository..."
        />
      </div>

      <div>
        <span>{() => state.githubList?.length ?? 0} repository results</span>
        <Button disabled={() => !state.githubList?.length} on:click={shuffle}>
          Shuffle
        </Button>
      </div>

      <div class="list" class:has-items={() => state.githubList?.length}>
        {() =>
          state.githubList?.map(item => (
            <GithubCard key={item.id} item={item} on:remove={onRemove} />
          )) ?? 'loading...'
        }
      </div>
    </>
  );
}

export default App;
