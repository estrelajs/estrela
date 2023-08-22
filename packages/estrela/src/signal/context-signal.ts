import { signal } from './signal';
import { ReadonlySignal, Signal } from '../types';
import { EstrelaTemplate } from '../template';

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
  // const symbol = Symbol('context');
  // const context: ContextSignal<T> = () => {
  //   if (!EstrelaTemplate.ref) {
  //     throw new Error('Cannot read context signal outside of component');
  //   }
  //   const signal = EstrelaTemplate.ref.getContext<T>(symbol);
  //   return () => signal?.() ?? defaultValue;
  // };
  // context.create = (initialValue: T) => {
  //   if (!EstrelaTemplate.ref) {
  //     throw new Error('Cannot create context signal outside of component');
  //   }
  //   const value = signal(initialValue);
  //   EstrelaTemplate.ref.setContext(symbol, value);
  //   return value;
  // };
  // return context;
}
