# babel-plugin-estrela

A babel plugin to process estrela jsx/tsx files.

### Estrela code example

```tsx
import { onDestroy } from 'estrela';

const App = () => {
  // create a number state with initial value equal to 0.
  let count = 0;

  // create an updater interval function.
  const interval = setInterval(() => count++, 1000);

  // clean interval on destroy this component.
  onDestroy(() => clearInterval(interval));
  
  // return JSX element.
  return <div>Count is { count * 2 }</div>
}
```

It will convert the code above to:

```js
import { h as _jsx, createProxyState as _$$ } from 'estrela/internal';
import { state, onDestroy } from 'estrela';

const App = () => {
  const _$ = /*#__PURE__*/_$$();
  _$.count = 0;
  setInterval(() => _$.count++, 1000);
  onDestroy(() => clearInterval(interval));
  return /*#__PURE__*/h('div', null, 'Count is ', [_$.$.count, _count => _count * 2]);
}
```

## Install

Using npm:

```bash
$ npm install --save-dev babel-plugin-estrela
```

or using yarn:

```bash
$ yarn add babel-plugin-estrela --dev
```

## Estrela

For more Estrela information, visit the github page at https://github.com/estrelajs/estrela/.
