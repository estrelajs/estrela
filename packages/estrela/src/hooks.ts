import { ComponentNode } from './internal/component-node';

/** Call the callback function when component is initialized. */
export function onInit(callback: () => void): void {
  throwIfOutsideComponent();
  ComponentNode.ref?.addHook('init', callback);
}

/** Call the callback function when component is destroyed. */
export function onDestroy(callback: () => void): void {
  throwIfOutsideComponent();
  ComponentNode.ref?.addHook('destroy', callback);
}

function throwIfOutsideComponent() {
  if (!ComponentNode.ref) {
    throw new Error(
      'Out of Context! You can only use this function inside a component.'
    );
  }
}
