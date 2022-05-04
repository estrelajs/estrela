# vite-plugin-estrela

A vite plugin to process estrela jsx/tsx files.

### Estrela code example

```tsx
import { state, onDestroy } from 'estrela';

const App = () => {
  // create a number state with initial value equal to 0.
  const count = state(0);

  // create an updater interval function.
  const interval = setInterval(() => count.update(value => ++value), 1000);

  // clean interval on destroy this component.
  onDestroy(() => clearInterval(interval));
  
  // return JSX element.
  return <div>Count is { count() * 2 }</div>
}
```

It will convert the code above to:

```js
import { h as _jsx } from 'estrela/dom';
import { state, onDestroy } from 'estrela';

const App = () => {
  const count = state(0);
  setInterval(() => count.update(value => ++value), 1000);
  onDestroy(() => clearInterval(interval));
  return h('div', null, 'Count is ', [count, _count => _count * 2]);
}
```

## Installation

### npm

```bash
$ npm i --save-dev vite-plugin-estrela
```

### yarn

```bash
$ yarn add --dev vite-plugin-estrela
```

## Usage

### Vite Config

```js
// vite.config.js
import estrela from "vite-plugin-estrela";

export default {
  plugins: [estrela()],
};

```

## Estrela

For more Estrela information, visit the github page at https://github.com/estrelajs/estrela/.