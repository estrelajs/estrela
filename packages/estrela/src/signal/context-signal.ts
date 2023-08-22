import { ComponentNode } from '../template/component-node';
import { signal } from './signal';
import { ReadonlySignal, Signal } from '../types';

export interface ContextSignal<T> {
  (): ReadonlySignal<T>;
  create(initialValue: T): Signal<T>;
}

/**
 * Creates a new context signal.
 * @param defaultValue Default value for when the context is not set.
 * @returns A context signal function with additional methods for creating the context.
 */
export function contextSignal<T>(defaultValue: T) {
  const symbol = Symbol('context');

  const context: ContextSignal<T> = () => {
    if (!ComponentNode.ref) {
      throw new Error('Cannot read context signal outside of component');
    }
    const signal = ComponentNode.ref.getContext<T>(symbol);
    return () => signal?.() ?? defaultValue;
  };

  context.create = (initialValue: T) => {
    if (!ComponentNode.ref) {
      throw new Error('Cannot create context signal outside of component');
    }
    const value = signal(initialValue);
    ComponentNode.ref.setContext(symbol, value);
    return value;
  };

  return context;
}
