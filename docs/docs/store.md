# Store

Store is very similar to `State`, it is an `observable` that holds the current state. You can get the current value or update it providing a reducer function. You can create selectors of a store to get a subset of the state.

```ts
import { createSelector } from 'estrela';
import { createStore } from 'estrela/store';

const store = createStore({ count: 0});

const count = createSelector(store, state => state.count);

const increase = () => store.update(state => ({ count: state.count + 1 }));
```
