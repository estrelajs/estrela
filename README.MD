# Estrela ⭐

### Full Reactive Web Components

Estrela is a JavaScript library for building reactive web components inspired by [lit](https://github.com/lit/lit).

Just like Lit, Estrela is a boilerplate-killing component that provides reactive state, scoped styles, and a declarative template system that's tiny, fast and expressive. However, it allows you to choose either class or function based custom elements just like React.

For reactivity, Estrela extends RxJs observables to create the state of your component, so you will be able to subscribe and extend them with RxJs pipes.

### Documentation

Head over to [estrelajs.gitbook.io](https://estrelajs.gitbook.io/estrela/)

### Installation

To install:

```
# npm
npm install --save estrela

# yarn
yard add estrela
```

## Example

Estrela takes advantage of web components. To define your custom element, you need to provide a class/function with a render function. Functional Elements will be called just once, so there's no need for hooks. You can just declare your variables and use them.

```tsx
// main.ts
import { defineElement, html, prop, state } from 'estrela';

const App = () => {
  // Count value state. Initial value = 0.
  const count = state(0);

  // To get the current state value, just call it like a normal function.
  console.log(count());

  // Change its state by calling "next" or "update" methods.
  // The "update" receives a callback function with the current value
  // as parameter and expects the next value to be returned.
  setInterval(() => count.update(value => ++value), 1000);

  // Subscribe to value changes and do any kind of side effect you want.
  // e.g. update database on value changes.
  count.subscribe(console.log);

  // Return the template builder function.
  // The ":count" syntax is to bind the "count" prop on "app-counter".
  return () => html`<app-counter :count=${count}></app-counter>`;
};

const Counter = () => {
  // Define a prop state.
  const count = prop<number>();

  // Return the template builder function.
  // Note: calling the state value getter function is optional.
  return () => html`<div>Count is ${count}</div>`;
};

defineElement('app-counter', Counter);
defineElement('app-root', App);

// index.html
...
<body>
  <app-root></app-root>
</body>
```

Check more examples on [docs](https://estrelajs.gitbook.io/estrela/).

## Contributing

Estrela is open source and we appreciate issue reports and pull requests.

Instructions coming soon...
