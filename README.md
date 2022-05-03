<h1 align="center">Estrela - Full Reactive Framework</h1>

<p align="center">
  <img src="images/logo.png" alt="estrela-logo" width="120px" height="120px"/>
  <br>
  <p align="center">Estrela is a Javascript library to develop reactive web apps.</p>
  <br>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/estrela">
    <img src="https://img.shields.io/npm/v/estrela?color=009DFF&label=NPM%20Package&logo=npm" alt="Angular on npm" />
  </a>&nbsp;
</p>

<hr>

## Documentation

Coming soon...

## Installation

### TL;DR

Start an Estrela project by running the following `degit` command:

```bash
$ npx degit estrelajs/template my-project-name
```

### Plain JavaScript

Estrela has been designed with JSX files in mind, but it is still possible to use it with plain JavaScript files. For that, install it via NPM and use the `h()` function to build the HTML template.

Install from NPM:
```bash
$ npm i --save estrela
```

Using the `h()` function to build template:
```js
import { h, render } from 'estrela/dom';

const template = h('h1', null, 'Hello World');

render(template, document.body);
```

### JSX

To compile JSX/TSX files, it's required to install the Estrela Babel plugin. The easiest way to setup an Estrela environment is by using [vite](https://vitejs.dev/) with [vite-plugin-estrela](https://www.npmjs.com/package/vite-plugin-estrela).

To bootstrap a vite project run:

```bash
# JavaScript
$ yarn create vite my-estrela-app --template vanilla

# TypeScript
$ yarn create vite my-estrela-app --template vanilla-ts
```

Install `estrela` and `vite-plugin-estrela` packages:

```bash
$ cd my-estrela-app
$ yarn add estrela
$ yarn add --dev vite-plugin-estrela
```

Add `vite.config.js` file to root and setup the plugin:

```js
import estrela from "vite-plugin-estrela";

export default {
  plugins: [estrela()],
};
```

Rename `main.js` to `main.jsx` and run this simple example:

```jsx
import { render } from 'estrela/dom';

function App() {
  return <h1>Hello World</h1>
}

render(<App />, document.getElementById('app'));
```