import { State, createState } from './observables';
import { ProxyState } from './proxy-state';
import { Key } from './types/types';

const ComponentRef = null as any;

/** Call the callback function when component is destroyed. */
export function onDestroy(callback: () => void): void {
  throwIfOutsideComponent();
  ComponentRef.currentRef?.pushHook('destroy', callback);
}

/** Get the state reference of a local variable. */
export function getState<T>(state: T): State<T>;
/** Get the state reference from a proxy state. */
export function getState<T>(state: ProxyState<T>, name: keyof T): State<T>;
export function getState(state: any, name?: any): State<any> {
  throwIfOutsideComponent();
  return name && state?.$?.[name] instanceof State
    ? state.$[name]
    : createState(state);
}

/** Get component context. */
export function getContext<T extends Object>(): T | undefined;
export function getContext<T>(key: Key): T | undefined;
export function getContext(key?: Key) {
  throwIfOutsideComponent();
  const node = ComponentRef.currentRef!.node;
  return key ? node.context[key] : node.context;
}

/** Set component context. */
export function setContext<T extends Object>(context: T): void;
export function setContext<T>(key: Key, value: T): void;
export function setContext(keyOrContext: any, value?: any): void {
  throwIfOutsideComponent();
  const node = ComponentRef.currentRef!.node;
  if (typeof keyOrContext === 'object') {
    node.context = keyOrContext;
  } else {
    node.context[keyOrContext] = value;
  }
}

/** Define Ref for the current component. */
export function setRef<T>(ref: T): void {
  throwIfOutsideComponent();
  ComponentRef.currentRef?.setRef(ref);
}

function throwIfOutsideComponent() {
  if (!ComponentRef.currentRef) {
    throw new Error(
      'Out of Context! You can only use this function inside a component.'
    );
  }
}
