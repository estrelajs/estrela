import { EstrelaTemplate } from './template/estrela-template';

/** Calls the callback function when component is initialized. */
export function onInit(cb: () => void): void {
  throwIfOutsideComponent('onInit');
  EstrelaTemplate.hookContext?.init.push(cb);
}

/** Calls the callback function when component is destroyed. */
export function onDestroy(cb: () => void): void {
  throwIfOutsideComponent('onDestroy');
  EstrelaTemplate.hookContext?.destroy.push(cb);
}

function throwIfOutsideComponent(hook: string) {
  if (!EstrelaTemplate.hookContext) {
    throw new Error(
      `"${hook}" can only be called within the component function body
      and cannot be used in asynchronous or deferred calls.`
    );
  }
}
