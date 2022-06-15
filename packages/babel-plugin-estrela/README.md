# babel-plugin-estrela

A babel plugin to process estrela jsx/tsx files.

### Estrela code example

```tsx
import { onDestroy } from 'estrela';

const App = () => {
  // create a number state with initial value equal to 0.
  let count = 0;

  // subscribe to "count" state changes.
  count$.subscribe(console.log);

  // create an updater interval function.
  const interval = setInterval(() => count++, 1000);

  // clean interval on destroy this component.
  onDestroy(() => clearInterval(interval));

  // return JSX element.
  return <div>Count is {count * 2}</div>;
};
```

It will transpile the code above to:

```js
import { template as _template, h as _h, $$ as _$$ } from "estrela/internal";
import { render } from "estrela";
import { onDestroy } from "estrela";

const _tmpl = _template("<div>Count is </div>");

const App = _props => {
  const _$ = /*#__PURE__*/_$$();

  _$.count = 0

  _$.$.count.subscribe(console.log);

  const interval = setInterval(() => _$.count++, 1e3);
  onDestroy(() => clearInterval(interval));
  return _h(_tmpl, {
    "0": {
      "children": [[() => _$.count * 2, null]]
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
