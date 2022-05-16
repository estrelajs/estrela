# State

States are the main concept of Estrela. Every part of the DOM tree that changes while the web application is running depends on a state property. They are based on the [tc39 observable proposal](https://github.com/tc39/proposal-observable) and other libraries like [RxJs](https://rxjs.dev/).

You can create a new state by calling the `createState` function and optionally pass an initial value as parameter. The `$` property will return the current value of the state, and you can call `next` or `update` function to update the state and `subscribe` to observe state changes.

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
`subscribe()` function returns a new `Subscription` object. It's highly recommended to run `subscription.unsubscribe()` to clear the observers when the state is no longer needed to prevent memory leak.
:::

The following example creates a global state and renders a simple template to display its value. Note that we are updating the value from inside of the `setInterval` function and there's no need to call the `render` function again, Estrela automatically updates the DOM when `count` emits a new value.

<iframe src="https://stackblitz.com/edit/estrelajs-state?ctl=1&embed=1&file=src/main.tsx&hideExplorer=1&hideNavigation=1&theme=light" style="width:100%;height:500px"></iframe>

::: warning
The `render` function adds the given template to a parent element. If you call it twice, it won't update the previous one but add the template again.
:::
