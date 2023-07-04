# vite-plugin-estrela

A vite plugin to pre-process jsx/tsx files for the estrela framework.

## Installation

Using npm:

```bash
$ npm install --save-dev @babel/core vite-plugin-estrela
```

or using yarn:

```bash
$ yarn add --dev @babel/core vite-plugin-estrela
```

## Usage

Add this plugin to your vite configuration file.

```js
// vite.config.js
import estrela from "vite-plugin-estrela";

export default {
  plugins: [estrela()],
};

```

## Estrela

For more Estrela information, visit the github page at https://github.com/estrelajs/estrela/.
