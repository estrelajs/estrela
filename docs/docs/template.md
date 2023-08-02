# Template: Express Yourself with JSX!

In Estrela, we keep things simple and powerful with JSX, the easiest way to write HTML in JavaScript. You might've seen it in React, and it's just as awesome here! 🎨

## Element: The Building Block

You can assign an HTML template to any variable in a JSX file, and it becomes an Estrela `EstrelaNode` object. This magical object is the foundation for rendering.

```jsx
const template = <div>My template</div>;
```

With JSX, creating templates becomes a breeze!

## Attribute: Add Some Flavor

Assign attributes to HTML elements using literal strings or variables. And guess what? Estrela uses the same attributes as plain HTML, so you can go with `class` instead of `className`.

```jsx
const myClass = 'my-class';

<div id="my-id" class={myClass}>
  My template
</div>;
```

Customize your elements with attributes and make them shine!

## Event Handler: Ready, Set, Action

To give your HTML elements some life, add event handlers using the `on:` prefix attribute. This nifty trick adds event listeners to elements and removes them when needed.

```jsx
<button on:click={() => alert('clicked')}>My Button</button>
```

Now your elements can listen and respond to user interactions! 🎉

## Bind: Link Your Data

Use binds to connect data with form elements like `input`, `select`, and more. Just provide a `signal` object to bind, and they'll be synced. 🤝

```jsx
import { signal } from 'estrela';

const myInput = signal('');

// This binds the input value to the "myInput" signal, and vice versa.
<input type="text" bind={myInput} />;
```

Get your form elements and data talking to each other in no time!

## Fragment: Group and Play!

Fragments are your secret weapon for grouping multiple elements into one. They're perfect when you want to wrap elements without adding extra markup.

```jsx
const template = (
  <>
    <h1>Hello World!</h1>
    <p>Welcome to Estrela</p>
  </>
);
```

Group and organize elements effortlessly! 🎭

## Expression: Let Your Data Flow

With JSX expressions, you can render any value to the template, like a list of items. Simply use `map` to loop through the data and create your elements.

```JSX
const fruits = [
  'apple',
  'banana',
  'orange',
];

const template = (
  <>
    <h1>Fruits</h1>
    <ul>
      {fruits.map(fruit => (
        <li>{fruit}</li>
      ))}
    </ul>
  </>
);

```

Let your creativity flow as you render lists and more! 🌊

::: tip
To optimize and prevent re-renders, pass a unique `key` attribute to each element.
:::
