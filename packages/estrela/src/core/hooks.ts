import { ComponentRef } from '../dom/virtual-dom/component-ref';

export function onDestroy(callback: () => void): void {
  ComponentRef.currentRef?.pushHook('destroy', callback);
}
