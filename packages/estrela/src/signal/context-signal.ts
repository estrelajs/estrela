import { signal } from './signal';
import { ReadonlySignal, Signal } from '../types';
import { EstrelaTemplate } from '../template';

export interface ContextSignal<T> {
  create(initialValue: T): Signal<T>;
  use(): ReadonlySignal<T>;
}

interface ThisContext<T> {
  readonly defaultValue: T;
  readonly symbol: symbol;
}

function create<T>(this: ThisContext<T>, initialValue: T): Signal<T> {
  if (!EstrelaTemplate.hookContext) {
    throw new Error('Cannot create context signal outside of component');
  }
  const value = signal(initialValue);
  EstrelaTemplate.context[this.symbol] = value;
  return value;
}

function use<T>(this: ThisContext<T>): ReadonlySignal<T> {
  if (!EstrelaTemplate.hookContext) {
    throw new Error('Cannot read context signal outside of component');
  }
  const signal = EstrelaTemplate.context[this.symbol] as Signal<T> | undefined;
  return () => signal?.() ?? this.defaultValue;
}

/**
 * Creates a new context signal.
 * @param defaultValue Default value for when the context is not set.
 * @returns A context signal function with additional methods for creating the context.
 */
export function contextSignal<T>(defaultValue: T): ContextSignal<T> {
  const proto: ThisContext<T> = { defaultValue, symbol: Symbol('context') };
  return {
    create: (create<T>).bind(proto),
    use: (use<T>).bind(proto),
  };
}
