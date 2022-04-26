import { Component, state } from 'estrela';
import { debounceTime, filter, from, switchMap, tap } from 'rxjs';
import Button from './Button';
import GithubCard from './GithubCard';
import { Repositories, Repository } from './repository';

const GITHUB_API = '//api.github.com/search/repositories';

const App: Component = () => {
  const searchQuery = state('');
  const githubList = state<Repositories | undefined>([]);

  from(searchQuery)
    .pipe(
      filter(query => query.length > 2),
      debounceTime(500),
      tap(() => githubList.next(undefined)),
      switchMap(query =>
        fetch(`${GITHUB_API}?q=${query}`)
          .then(res => res.json())
          .then<Repositories>(json => json?.items ?? [])
      )
    )
    .subscribe(data => githubList.next(data));

  function onRemove(item: Repository): void {
    githubList.update(list => list?.filter(x => x !== item));
  }

  function shuffle(): void {
    githubList.update(list => list?.sort(() => Math.random() - 0.5).slice());
  }

  return (
    <>
      <h1 style:color="blue">Github Example</h1>

      <div>
        <label for="search">Search:</label>
        <input
          id="search"
          bind={searchQuery}
          placeholder="Search for github repository..."
        />
      </div>

      <div>
        <span>{githubList()?.length ?? 0} repository results</span>
        <Button disabled={!githubList()?.length} on:click={shuffle}>
          Shuffle
        </Button>
      </div>

      <div class="list" class:has-items={githubList()?.length}>
        {githubList()?.map(item => (
          <GithubCard key={item.id} item={item} on:remove={onRemove} />
        )) ?? 'loading...'}
      </div>
    </>
  );
};

export default App;
