import { VirtualNode } from './internal';
import { createState, State } from './observables';
import { StateProxy } from './state-proxy';
import { Key } from './types/types';

/** Call the callback function when component is initialized. */
export function onInit(callback: () => void): void {
  throwIfOutsideComponent();
  VirtualNode.ref?.addHook('init', callback);
}

/** Call the callback function when component is destroyed. */
export function onDestroy(callback: () => void): void {
  throwIfOutsideComponent();
  VirtualNode.ref?.addHook('destroy', callback);
}

/** Get the state reference of a local variable. */
export function getState<T>(state: T): State<T>;
/** Get the state reference from a proxy state. */
export function getState<T>(state: StateProxy<T>, name: keyof T): State<T>;
export function getState(state: any, name?: any): State<any> {
  throwIfOutsideComponent();
  return name && state?.$?.[name] instanceof State
    ? state.$[name]
    : createState(state);
}

/** Set component context. */
export function setContext(key: Key, value: any): void;
export function setContext(context: any): void;
export function setContext(keyOrContext: any, value?: any): void {
  throwIfOutsideComponent();
  const context = VirtualNode.ref?.context;
  if (typeof keyOrContext === 'object') {
    VirtualNode.ref!.context = keyOrContext;
  } else if (context && typeof context === 'object') {
    VirtualNode.ref!.context = { ...VirtualNode.ref!.context };
    VirtualNode.ref!.context[keyOrContext] = value;
  } else {
    VirtualNode.ref!.context = keyOrContext;
  }
}

function throwIfOutsideComponent() {
  if (!VirtualNode.ref) {
    throw new Error(
      'Out of Context! You can only use this function inside a component.'
    );
  }
}
