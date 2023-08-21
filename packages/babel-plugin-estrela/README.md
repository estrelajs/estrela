# babel-plugin-estrela

A babel plugin to pre-process jsx/tsx files for the estrela framework.

### Estrela code example

```tsx
import { onDestroy, signal } from 'estrela';

const App = () => {
  // create a signal with initial value equal to 0.
  const count = signal(0);

  // create an updater interval function.
  const interval = setInterval(() => count.update(x => x + 1), 1000);

  // clean interval on destroy this component.
  onDestroy(() => clearInterval(interval));

  // return JSX element.
  return <div>Count is {count() * 2}</div>;
};
```

It will transpile the code above to:

```js
import { template as _template, h as _h } from "estrela/template";
import { onDestroy, signal } from "estrela";

const _tmpl = _template("<div>Count is </div>");

const App = _props => {
  const count = signal(0);
  const interval = setInterval(() => count.update(x => x + 1), 1e3);
  onDestroy(() => clearInterval(interval));
  return _h(_tmpl, {
    "0": {
      "children": [[() => count() * 2, null]]
    }
  });
};
```

## Install

Using npm:

```bash
$ npm install --save-dev babel-plugin-estrela
```

or using yarn:

```bash
$ yarn add --dev babel-plugin-estrela
```

## Estrela

For more Estrela information, visit the github page at https://github.com/estrelajs/estrela/.
