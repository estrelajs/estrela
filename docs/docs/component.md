# Components: Building Blocks of Your Web App!

Components are at the heart of building a fantastic web application with Estrela! They're simply functions that return a template. Let's dive in and see how easy it is to create powerful components. 🚀

## Defining a Component

Creating a component is as simple as defining a function that returns your desired template. For example:

```tsx
function App() {
  return <h1>Hello World</h1>;
}

(<App />).mount(document.getElementById('app')!);
```

This code sets up an `App` component that returns a heading element with "Hello World." By rendering the component, you bring it to life on your web page! 🌟

## Signals: Reactivity at Its Best

Components automatically react to signal changes, making them reactive and dynamic. To achieve this, you'll need to declare signals within your component to track changes and trigger updates:

```tsx
function Counter() {
  const count = signal(0);
  return <div>Count is {count()}</div>;
}
```

Now, every time the `count` value changes, the component will re-render, keeping things in sync with your signals. Easy, right?

## Props: Data Flow Between Componentsps

Props are a handy way to pass data from a parent component to a child component. Simply use the `this` keyword to access props in the component function:

```tsx
interface GreeterProps {
  name: string;
}

function Greeter(this: GreeterProps) {
  return <p>Hello {this.name}</p>;
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

Also, you can bind signals to props to make your components reactive:

```tsx
interface ShowCountProps {
  count: number;
}

function ShowCount(this: ShowCountProps) {
  effect(() => {
    console.log('Count is', this.count);
  });

  return <div>Count is {this.count}</div>;
}

function Counter() {
  const count = signal(0);

  setInterval(() => count.update(x => x + 1), 1000);

  return <ShowCount count={count()} />;
}
```

With props, you can customize and reuse your components seamlessly. 🎉

## Event Emitter: Components Speak Up!

Components can emit events just like common HTML elements. Use the `on:` prefix attribute to specify the event and use the `Output` type to define the event emitter:

```tsx
interface ShowCountProps {
  count: number;
  reset: Output<void>;
}

function ShowCount(this: ShowCountProps) {
  return (
    <div>
      <div>Count is {count}</div>
      <button on:click={this.reset}>Reset</button>
    </div>
  );
}

function Counter() {
  const count = signal(0);

  setInterval(() => count.update(x => x + 1), 1000);

  return <ShowCount count={count()} on:reset={() => count.set(0)} />;
}
```

With event emitters, components can communicate and trigger actions within your app. Dynamic and interactive, all in one!

## Children: A Special Kind of Props

"Children" is a magical prop that allows you to pass content between opening and closing tags of a component. This feature lets you nest components and customize their content in a natural way. 🔊

Example Usage:

```tsx
interface MyComponentProps {
  children?: JSX.Children;
}

function MyComponent(this: MyComponentProps) {
  return (
    <div>
      <h1>This is My Component</h1>
      {this.children}
    </div>
  );
}

function App() {
  return (
    <MyComponent>
      <p>Custom Content Here!</p>
    </MyComponent>
  );
}
```

By using this.children, your component can access and render the content provided between its tags. It's like unwrapping a surprise gift! 🎁

## Styled Components: CSS in JS

Estrela comes with a styling system that allows you to style your components using CSS. All the styles are automatically scoped to the component.

```tsx
import { Output } from 'estrela';

export interface ButtonProps {
  children?: JSX.Children;
  click?: Output<void>;
}

function MyButton(this: ButtonProps) {
  return (
    <button on:click={() => this.click?.()}>
      {this.children}
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

<!-- <iframe src="https://stackblitz.com/edit/estrelajs-component-state?ctl=1&embed=1&file=src/main.tsx&hideExplorer=1&hideNavigation=1&theme=light" style="width:100%;height:500px"></iframe> -->
