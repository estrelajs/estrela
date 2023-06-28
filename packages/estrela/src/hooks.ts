import { ComponentNode } from './internal/component-node';

/** Calls the callback function when component is initialized. */
export function onInit(cb: () => void): void {
  throwIfOutsideComponent('onInit');
  ComponentNode.ref?.addHook('init', cb);
}

/** Calls the callback function when component is destroyed. */
export function onDestroy(cb: () => void): void {
  throwIfOutsideComponent('onDestroy');
  ComponentNode.ref?.addHook('destroy', cb);
}

function throwIfOutsideComponent(hook: string) {
  if (!ComponentNode.ref) {
    throw new Error(
      `"${hook}" can only be called within the component function body
      and cannot be used in asynchronous or deferred calls.`
    );
  }
}
