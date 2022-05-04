import { ComponentRef } from '../dom/virtual-dom/component-ref';
import { State } from './observables';

export function $<T>(state: T): State<T> {
  return state as any;
}

export function onDestroy(callback: () => void): void {
  ComponentRef.currentRef?.pushHook('destroy', callback);
}
