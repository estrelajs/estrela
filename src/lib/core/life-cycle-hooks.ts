import { ComponentRef } from '../directives';

export function onInit(cb: () => void): void {
  ComponentRef.currentRef?.pushLifeCycleHook('onInit', cb);
}

export function onDestroy(cb: () => void): void {
  ComponentRef.currentRef?.pushLifeCycleHook('onDestroy', cb);
}
