const STATE_HOOK = Symbol('STATE_HOOK');
const EFFECT_HOOK = Symbol('EFFECT_HOOK');

export function getHooks(element: Object) {
  let index = 0;

  const get = (propertyKey: symbol, metadataKey: any) =>
    Reflect.getOwnMetadata(metadataKey, element, propertyKey);
  const has = (propertyKey: symbol, metadataKey: any) =>
    Reflect.hasOwnMetadata(metadataKey, element, propertyKey);
  const set = (propertyKey: symbol, metadataKey: any, value: any) =>
    Reflect.defineMetadata(metadataKey, value, element, propertyKey);

  const useState = (initialValue: any) => {
    const cachedIndex = index;
    if (!has(STATE_HOOK, cachedIndex)) {
      set(STATE_HOOK, cachedIndex, initialValue);
    }
    const state = get(STATE_HOOK, cachedIndex);
    const setter = (newValue: any) => {
      set(STATE_HOOK, cachedIndex, newValue);
    };
    index++;
    return [state, setter];
  };

  const useEffect = (callback: () => void | (() => void), dependencies: any[]) => {
    const cachedIndex = index;
    const hasChanged = dependencies.some(
      (dep, i) => dep !== get(STATE_HOOK, cachedIndex)?.[i]
    );
    if (dependencies === undefined || hasChanged) {
      get(EFFECT_HOOK, cachedIndex)?.();
      set(EFFECT_HOOK, cachedIndex, callback());
      set(STATE_HOOK, cachedIndex, dependencies);
    }
    index++;
  };

  return { useState, useEffect };
}
