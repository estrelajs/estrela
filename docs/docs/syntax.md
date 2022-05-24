# Syntax

Estrela utilizes JSX for writing HTML templates. JSX is the simplest way to write HTML in JS and it got very popular in the last years with React.

## Element

You can assign HTML template to any variable in a JSX file.

```jsx
const template = <div>My template</div>;
```

HTML template returns a Estrela `VirtualNode` object which is used internally for rendering.

## Attribute

Attributes can be assigned to HTML elements using literal strings or variables.

```jsx
const myClass = 'my-class';
<div id="my-id" class={myClass}>
  My template
</div>;
```

::: tip
Estrela uses the same attributes as plain HTML. For example, you can use `class` attribute instead of `className`.
:::

## Event Handler

To assign event handlers to HTML elements, use the `on:` prefix attribute.

```jsx
<button on:click={() => alert('clicked')}>My Button</button>
```

It will add an event listener to the element and will remove when the element is removed.

## Bind

Binds can be used to bind data to Form elements like `input`, `select` and others. You need to provide a `State` object to bind.

```jsx
import { createState } from 'estrela';

const myInput = createState('');

// This will bind the value of the input to the "myInput" state and vice versa.
<input type="text" bind={myInput} />;
```

## Fragment

Fragments are used to group multiple elements. They are useful when you want to group multiple elements in a single element. Fragment is a wrapper element that doesn't render anything.

```jsx
const template = (
  <>
    <h1>Hello World!</h1>
    <p>Welcome to Estrela</p>
  </>
);
```

## Expression

You can render any value to the template by using JSX expressions. A good use case is rendering a list of items.

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

::: tip
To keep track of items and prevent re-renders, you can pass a `key` attribute to each element.
:::
