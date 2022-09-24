import { EstrelaNode } from './internal/estrela-node';

/** Call the callback function when component is initialized. */
export function onInit(callback: () => void): void {
  throwIfOutsideComponent();
  EstrelaNode.ref?.addHook('init', callback);
}

/** Call the callback function when component is destroyed. */
export function onDestroy(callback: () => void): void {
  throwIfOutsideComponent();
  EstrelaNode.ref?.addHook('destroy', callback);
}

/** Set component context. */
export function setContext(context: {}): void {
  throwIfOutsideComponent();
  EstrelaNode.ref?.setContext(context);
}

function throwIfOutsideComponent() {
  if (!EstrelaNode.ref) {
    throw new Error(
      'Out of Context! You can only use this function inside a component.'
    );
  }
}
