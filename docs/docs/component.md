# Component

Components are the building blocks and the main way to build a web application. In Estrela, components are defined by a function that returns a template.

```jsx
function App() {
  return <h1>Hello World</h1>;
}

render(<App />, document.getElementById('app')!);
```

## States

To create a state from within a component, just declare it using the `let` keyword.

```jsx{2}
function Counter() {
  let count = 0;
  return <div>Count is {count}</div>;
}
```

And that's all! Anytime the `count` value changes, the component will be re-rendered.

<iframe src="https://stackblitz.com/edit/estrelajs-component-state?ctl=1&embed=1&file=src/main.tsx&hideExplorer=1&hideNavigation=1&theme=light" style="width:100%;height:500px"></iframe>

Under the hood, Estrela creates a local proxy state in the component scope. Every time you call one of the properties, it internally gets and sets their individual states.

::: details
To enable this feature, you need to use the babel plugin which comes with `vite-plugin-estrela` enabled by default. If you want to disable automatic states, you can set `autoDeclareStates` option to `false`.
:::

## State Ref

Once you declare states using the `let` keyword, you will be able to get and set state values. However, you won't be able to subscribe to state changes and do other `State` operations.

To get the state reference of each variable, call `getState()` and pass the local variable as parameter.

```jsx{7}
import { getState } from 'estrela';

function Counter() {
  let count = 0;

  // gets the state reference for "count".
  getState(count).subscribe(console.log);

  return <div>Count is {count}</div>;
}
```

Alternatively, you can get the state by adding a `$` suffix to the declared variable name.

```jsx{5}
function Counter() {
  let count = 0;

  // gets the state reference for "count".
  count$.subscribe(console.log);

  return <div>Count is {count}</div>;
}
```

::: tip
When working with TypeScript, you need to add the Estrela plugin to prevent the compiler from complaining about the missing properties. If you're using VSCode, you can install [`Estrela for VSCode`](https://marketplace.visualstudio.com/items?itemName=estrelajs.estrela-vscode) extension.
:::

::: warning
`typescript-estrela-plugin` won't add the correct type to the `$` suffixed properties, it will remain as `any`. We're working to improve this in the future.
:::

## Props

Props are used to pass data from the parent component to the child component. Props are passed as object to the first argument of the component function.

```jsx
function Greeter(props) {
  return <p>Hello {props.name}</p>;
}

function App() {
  return (
    <div>
      <h1>Hello World</h1>
      <Greeter name="Stranger" />
    </div>
  );
}
```

Props are state proxy objects that are automatically updated when the parent component changes their state, you can subscribe to them using the `subscribe` method.

```jsx{10}
function Counter() {
  let count = 0;

  setInterval(() => count++, 1000);

  return <ShowCount count={count} />;
}

function ShowCount({ count }) {
  count$.subscribe(console.log);

  return <div>Count is {count}</div>;
}
```

::: tip
Props and local states will automatically complete when the component is destroyed. So there's no need to unsubscribe their subscriptions.
:::

## Event Emitter

Like common HTML elements, you can emit events from a component. When you add `on:` prefix to the attribute name, Estrela will provide an `EventEmitter` instance, which you can use to emit events.

```jsx
function Counter() {
  let count = 0;

  setInterval(() => count++, 1000);

  return <ShowCount count={count} on:reset={() => (count = 0)} />;
}

function ShowCount({ count, reset }) {
  return (
    <div>
      <div>Count is {count}</div>
      <button on:click={() => reset.emit()}>Reset</button>
    </div>
  );
}
```

## Context

As you already know, you can share data with global states. However, if you want to restrict the data to a specific component tree, you can use the `Context` API.

```jsx
import { getContext, setContext } from 'estrela';

function MyContent({ theme }) {
  // use "theme$" to provide the prop state reference
  // instead of just the current value.
  setContext('theme', theme$);
  return (
    <div>
      ...
      <Button />
    </div>
  );
}

function Button({ click }) {
  // get "theme" state reference.
  const theme = getContext('theme');
  return (
    <button
      on:click={click}
      style:background={() => (theme.$ === 'dark' ? '#333' : '#fff')}
    >
      Click me!
    </button>
  );
}

function App() {
  return (
    <>
      <MyContent theme="dark" />
      <MyContent theme="light" />
    </>
  );
}
```

## Children

Children are content that comes from outside of components. You can render children content from the `children` property or use the `<slot />` element.

```jsx
// Using the children prop
function Button({ children }) {
  return <button>{children}</button>;
}

// Using the slot element
function Button() {
  return (
    <button>
      <slot />
    </button>
  );
}
```

These are some benefits of using `<slot />` element instead of `children` prop:

- If no children are provided, it will render the default content inside of `<slot>`.
- You can specify which child will be rendered by using the `name` attribute.
- You can select the children content type by using the `select` attribute.

```jsx
function If({ condition }) {
  return condition ? (
    <slot>Content is True</slot>
  ) : (
    <slot name="else">Content is False</slot>
  );
}

<If condition={5 > 2}>
  <p>5 is greater than 2</p>
  <p name="else">What the hell?!</p>
</If>;
```

But if you want to deal with the children data like call a child function, you need to use the `children` prop.

For TypeScript, when using `slot`, you can type your component by using the `Component` interface and passing the children type as the second type parameter:

```tsx
// Will only accept "string" children
const Button: Component<ButtonProps, string[]> = ({ click }) => (
  <button on:click={click.emit()}>
    <slot />
  </button>
);
```

## Styling

Estrela comes with a styling system that allows you to style your components using CSS. All the styles are automatically scoped to the component.

```jsx
import { styled } from 'estrela';

function MyButton({ click }) {
  return (
    <button on:click={click.emit()}>
      <slot />
    </button>
  );
}

export default styled(MyButton)`
  button {
    background-color: #f00;
    color: #fff;
  }
`;
```

::: tip
Use [`Estrela for VSCode`](https://marketplace.visualstudio.com/items?itemName=estrelajs.estrela-vscode) extension to highlight the CSS syntax and use code completion to get the correct CSS property names.
:::
