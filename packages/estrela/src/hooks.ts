import { ComponentRef } from './internal';

export function onDestroy(callback: () => void): void {
  ComponentRef.currentRef?.pushHook('destroy', callback);
}
