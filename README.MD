# Estrela ⭐

### Full Reactive Web Components

Estrela is a JavaScript library for building reactive web components inspired by [lit](https://github.com/lit/lit).

Just like Lit, Estrela is a boilerplate-killing component that provides reactive state, scoped styles, and a declarative template system that's tiny, fast and expressive. However, it allows you to choose either class or function based custom elements just like React.

For reactivity, Estrela extends RxJs observables to create the state of your component, so you will be able to subscribe and extend your local states with RxJs pipes.

### Documentation

Coming soon. For now, checkout the examples below.

### Installation

To install from npm:

```
npm i estrela
```

And from yarn:

```
yard add estrela
```

## Examples

### DOM Render

Just like other frameworks, Estrela provides a `render` function that renders any Html content on any document element.

```ts
const name = 'World';

render(`<div>Hello ${name}!</div>`, document.getElementById('app')!);

// result:
// <div>Hello World!</div>
```

It's fine to use string content, but to take benefit of data binding and all Estrela features, you need to use the html directive.

```ts
const onclick = () => console.log('clicked');

render(html`<button on:click=${onclick}>Click me!</button>`, document.getElementById('app')!);

// result:
// <button>Click me!</button>
//
// after click, console output:
// "clicked"
```

### Web Component

Estrela takes advantages of web components. To define your custom element, you need to provide a class or a function returning a render function.

```ts
// app.ts

const App: Fel = () => {
  const name = 'World';
  const onclick = () => console.log('clicked');

  return () => html`
    <div>Hello ${name}!</div>
    <button on:click=${onclick}>Click me!</button>
  `
}

defineElement('app-root', App);

// index.html
...
<body>
  <app-root></app-root>
</body>

// result:
// <div>Hello World!</div>
// <button>Click me!</button>
```

### States

States are the main concept of Estrela. Every local state, input and output props are instances of `StateSubject` which inherits `Subject` from RxJs. So that means that you can subscribe to all your states.

A `StateSubject` instance is a function that returns the current state value when it's called. Although, it still contains all the RxJs `Subject` methods, so you can still change it by calling `next()` or even the new `update()` method.

```ts
import { defineElement, Fel, html, setProperties, state } from 'estrela';

const App: Fel = () => {
  // Count value state. Initial value = 0.
  const count = state(0);

  // To get the current state value, just call it like a normal function.
  console.log(count());

  // Change its state by calling `next` or `update` methods.
  // `update` receives a callback function with the current value
  // as parameter and will expect the next value to be returned.
  setInterval(() => count.update(value => ++value), 1000);

  // Subscribe to value changes and do any kind of side effect you want.
  // e.g. update database on value changes.
  count.subscribe(console.log);

  // Return the template builder function.
  // The `:count` syntax is to bind the `count` prop on "app-counter".
  return () => html`<app-counter :count=${count()}></app-counter>`;
};

const Counter: Fel = () => {
  // Define a count state. (Initial value is optional)
  const count = state<number>();

  // Call `setProperties` function to tell which states are properties.
  // Props are key-value object, that means that the "count" key
  // will be bound with the "count" state.
  setProperties({ props: { count } });

  // Return the template builder function.
  // Note: calling the state value getter function is optional.
  return () => html`<div>Count is ${count}</div>`;
};

defineElement('app-counter', Counter);
defineElement('app-root', App);
```

More examples coming soon...

## Contributing

Estrela is open source and we appreciate issue reports and pull requests.

Instructions coming soon...
