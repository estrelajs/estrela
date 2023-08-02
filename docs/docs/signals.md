# Signals

Let's talk about signals in Estrela! They're like these cool containers that hold values that can change over time. 📦💨

They represent data that reacts to changes, and when a signal's value changes, it emits a fresh new value. Think of them like broadcasting stations for your data updates!

## Creating a Signal

To get started, you simply need to call the `signal` function. Easy peasy! 😎 Just give it an initial value, and it returns the signal for you.

```js
import { signal } from 'estrela';

const myCounter = signal(0);
```

In this example, we've created a `myCounter` signal with an initial value of 0.

Additionally, you can pass an optional equal function as the second parameter, which is used to compare the results to detect distinct value emits. By default, it uses the strict equality (a === b) for comparison.

## Checking the Current Value

Okay, now you've got your signal all set up. To see what's inside, you just call the signal like a function. Ta-da! 🎉

```js
console.log(myCounter()); // 0
```

This `console.log` will display the current value of `myCounter`. Simple, right?

## Updating the Signal

The real magic happens when you update the signal's value. 🪄 You do this with the `set`, `update`, or `mutate` methods.

### `set`: The Direct Setter

Use `set` when you want to set a new value for your signal. Once you call `set(newValue)`, the signal's value updates and notifies any observers automatically.

```js
myCounter.set(42);
```

Boom! Now your `myCounter` has a value of 42. The whole app knows about it!

### `update`: The Fancy Modifier

Sometimes, you want to update the value based on the current one. 🔄 `update` is perfect for this! Just pass in an `updaterFunction` that modifies the current value and returns the updated version.

```js
myCounter.update(currentValue => {
  // Let's increment the value by 1
  return currentValue + 1;
});
```

With this code, you increased the value of `myCounter` by 1. Isn't it smooth?

### `mutate`: The Straight Mutator

When your signal contains mutable objects or arrays, `mutate` comes to the rescue! 💪 You get the current value inside the `mutatorFunction`, make changes directly, and the signal handles it all neatly.

```js
myMutableObjectSignal.mutate(currentValue => {
  // Update properties directly
  currentValue.someProperty = 'new value';
});
```

Now, `myMutableObjectSignal` has updated properties like magic!

So, that's the power of signals! With Estrela's reactive signals, you can easily manage your application's state and keep things updated and in sync without breaking a sweat. 🤓

## Computed Signals

In addition to regular signals, Estrela also offers "computed" signals, a powerful tool for generating derived signals that automatically notify when the computed value changes. 🔄

To create a `computed` signal, you call the computed function, providing it with a function that computes the new value based on other signals. The function returns a `ReadonlySignal`, which you can use like any other signal.

```js
import { signal, computed } from 'estrela';

const signalA = signal(10);
const signalB = signal(20);

const myComputedSignal = computed(() => {
  // Compute the new value based on signalA and signalB
  return signalA() + signalB();
});
```

In this example, `myComputedSignal` is a new `ReadonlySignal` that depends on `signalA` and `signalB`. Whenever `signalA` or `signalB` changes, `myComputedSignal` will be automatically updated.

Computed signals are versatile, just like normal signals. You can provide an equality function as the second argument to the `computed` function to customize the comparison logic for their updates.