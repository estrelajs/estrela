import { effect, signal } from 'estrela';
import Button from './Button';
import GithubCard from './GithubCard';
import { Repositories, Repository } from './repository';

const GITHUB_API = '//api.github.com/search/repositories';

function App() {
  const loading = signal(false);
  const githubList = signal<Repositories>([]);
  const searchQuery = signal('');

  effect(() => {
    if (searchQuery().length > 2) {
      loading.set(true);
      fetch(`${GITHUB_API}?q=${searchQuery()}`)
        .then(res => res.json())
        .then(json => {
          githubList.set(json?.items ?? []);
          loading.set(false);
        });
    }
  });

  function onRemove(item: Repository): void {
    githubList.update(list => list.filter(x => x !== item));
  }

  function shuffle(): void {
    githubList.mutate(list => list.sort(() => Math.random() - 0.5));
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
        <span>{githubList().length} repository results</span>
        <Button disabled={githubList().length === 0} on:click={shuffle}>
          Shuffle
        </Button>
      </div>

      <div class="list" class:has-items={githubList().length > 0}>
        {loading()
          ? 'loading...'
          : githubList().map(item => (
              <GithubCard key={item.id} item={item} on:remove={onRemove} />
            ))}
      </div>
    </>
  );
}

export default App;
