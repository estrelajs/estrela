import { ComponentRef } from './internal';

export function onDestroy(callback: () => void): void {
  ComponentRef.currentRef?.pushHook('destroy', callback);
}

export function setRef<T>(ref: T): void {
  ComponentRef.currentRef?.setRef(ref);
}
