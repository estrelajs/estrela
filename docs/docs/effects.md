# Effects: React to Signal Changes

In Estrela, effects are like magical listeners that reacts to changes in signals! They allow you to perform certain actions or tasks whenever the data in the signals you're interested in gets updated. 🚀

## Creating an Effect

To set up an effect, simply invoke the `effect` function and provide it with your desired effect. Simple as pie! 🍰

```js
import { signal, effect } from 'estrela';

const myCounter = signal(0);

effect(() => {
  console.log(`The counter value changed! Current value: ${myCounter()}`);
});
```

In this example, we created an `effect` that listens to changes in the `myCounter` signal. Whenever `myCounter` changes, the effect function logs the updated value to the console.

## Stopping an Effect

Sometimes, you need to give your effects a break, right? 😉 No worries! The `effect` function returns a closing function that you can call to stop the effect from triggering.

```js
const stopEffect = effect(() => {
  // Effect function code here
});

// To stop the effect, simply call the stopEffect function
stopEffect();
```

When you call `stopEffect()`, the effect will be silenced, and it won't be triggered anymore.

::: tip
Effects declared within Estrela components get automatically stopped when the component is destroyed. No manual intervention needed! It keeps your code clean and hassle-free. 🎉
:::

## Clean-up on Effect Stop

You know what's even cooler? If you return a function from within the effect function, it will be called when the effect is stopped. This gives you a chance to clean up any code or resources you no longer need. 🧹

```js
const myEffectWithCleanUp = effect(() => {
  console.log("Effect is running!");

  return () => {
    console.log("Effect is stopped! Cleaning up...");
    // Your clean-up code here
  };
});

myEffectWithCleanUp();
```

When `myEffectWithCleanUp` is called, the clean-up function will be automatically called, letting you tidy things up.

## Untrack a Signal

Wait, there's more! Sometimes, you may want to block a signal from being observed by an effect. 🛡️ You can use the untrack function to do just that! Simply wrap the signal inside untrack, and the effect won't be triggered by changes in that signal.

```js
import { signal, effect, untrack } from 'estrela';

const myCounter = signal(0);

effect(() => {
  // This effect won't be triggered by changes in myCounter
  console.log(`The counter value will be printed only once! Current value: ${untrack(myCounter)}`);
});
```

With untrack, you're in control of what triggers your effects!
