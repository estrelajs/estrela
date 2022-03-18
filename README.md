# Estrela ⭐

### Full Reactive Web Components

Estrela is a JavaScript library for building reactive web components inspired by [lit](https://github.com/lit/lit) and [svelte](https://github.com/sveltejs/svelte).

Just like them, Estrela is a boilerplate-killing component that provides reactive state, scoped styles, and a declarative template system that's tiny, fast and expressive. However, it allows you to choose how you want to write your components, you can use class, function or the own estrela file format.

For reactivity, Estrela extends RxJs `Observable` to create states for your component, that means that you will be able to subscribe and extend them by using RxJs pipes.

### Documentation

Head over to [estrelajs.gitbook.io](https://estrelajs.gitbook.io/estrela/)

### Installation

To install Estrela on your project, run `npm` or `yarn` command to install estrela and rxjs:

```bash
# npm
$ npm install --save estrela rxjs

# yarn
$ yarn add estrela rxjs
```

Or you can start a new project using the Estrela template by running `degit` command:

```bash
$ npx degit estrelajs/template my-project-name
```

## Basic Estrela Features Example

Estrela takes advantage of web components. To define your custom element, you need to provide a class or a function with a render function. Functional Elements will be called just once, so there's no need for hooks, just declare your variables and use them.

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
  return () => html`<app-counter count=${count}></app-counter>`;
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

Check more examples on [docs](https://estrelajs.gitbook.io/estrela/) site.

## Using Estrela Custom Files

Estrela has its own file format that facilitates the component writing. It removes all the configuration part and allows you to use JSX elements instead of `html` template strings. Here is a simpler version of the example above:

```html
<!-- Your element logic lives here. (tag attribute is required to create your custom element) -->
<script tag="app-root">
  import { state } from 'estrela';

  const count = state<number>(0);

  setInterval(() => count.update(value => ++value), 1000);
</script>

<!-- Here goes your html template using JSX bindings. -->
<div>Count is {count}</div>
```

To run a project with Estrela files, you will need the Estrela preprocessor. You can integrate it with `vite` by installing [vite-plugin-estrela](https://github.com/estrelajs/vite-plugin-estrela) or just by running the `degit` command above to bootstrap a startup project for you.

## Contributing

Estrela is open source and we appreciate issue reports and pull requests.
