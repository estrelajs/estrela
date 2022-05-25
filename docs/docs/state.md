# State

States are the main concept of Estrela. Every part of the DOM tree that changes while the web application is running, depends on a state. They are based on the [tc39 observable proposal](https://github.com/tc39/proposal-observable) and other libraries like [RxJs](https://rxjs.dev/).

## Create State

You can create a new state by calling the `createState` and optionally pass an initial value as parameter. The `$` property will return the current value of the state, `next` and `update` will update the state and `subscribe` will observe the state and emit on change.

```js
import { createState } from 'estrela';

// create a state with "0" as initial value.
const count = createState(0);

// log the current value.
console.log(count.$);

// subscribe to "count" changes.
const subscription = count.subscribe(value => {
  // log the new value.
  console.log(value);
});
```

::: tip
Calling `subscribe` will return a new `Subscription` object. To prevent memory leak, It's highly recommended to run `Subscription.unsubscribe()` to clear the observers when the state is no longer needed.
:::

The following example creates a global state and renders a simple template to display its value. Note that we are updating the value from within `setInterval` and there's no need to call `render` again, Estrela automatically updates the DOM when `count` emits a new value.

<iframe src="https://stackblitz.com/edit/estrelajs-state?ctl=1&embed=1&file=src/main.tsx&hideExplorer=1&hideNavigation=1&theme=light" style="width:100%;height:500px"></iframe>

## Selectors

Selectors combine states to create new state. It's useful to create side effects like server data fetching.

```js
import { createState, createSelector } from 'estrela';

const name = createState('');
const age = createState(0);

// Create a new state that combines the values of `name` and `age`.
const fullName = createSelector(() => `${name.$} (${age.$})`);
```

You can also create a selector that depends on others states or even on other `Subscribable` objects by just explicitly passing the states as the first parameters.

```js
import { createEventEmitter, createState, createSelector } from 'estrela';

// Event Emitter is an Observable that emits events.
const log = createEventEmitter();
const name = createState('');
const age = createState(0);

// Will log the value of `name` and `age` when they change or when `log` emits an event.
createSelector(log, () => console.log(`${name.$} (${age.$})`)).subscribe();
```

## RxJs

You can convert Estrela states into Rxjs observables by calling `from` and passing the state as parameter.

```js
import { createState } from 'estrela';
import { from } from 'rxjs';
import { filter } from 'rxjs/operators';

const count = createState(0);

// will only log even numbers.
from(count)
  .pipe(filter(value => value % 2 === 0))
  .subscribe(value => console.log(value));
```
