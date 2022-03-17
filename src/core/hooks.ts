import { CustomElement } from '../types';
import { CONTEXT } from './context';
import { render } from './template/render';

const STATE_HOOK = Symbol('STATE_HOOK');
const EFFECT_HOOK = Symbol('EFFECT_HOOK');

function getReflections(element: Object) {
  const get = (propertyKey: symbol, metadataKey: any) =>
    Reflect.getOwnMetadata(metadataKey, element, propertyKey);
  const has = (propertyKey: symbol, metadataKey: any) =>
    Reflect.hasOwnMetadata(metadataKey, element, propertyKey);
  const set = (propertyKey: symbol, metadataKey: any, value: any) =>
    Reflect.defineMetadata(metadataKey, value, element, propertyKey);

  return { get, has, set };
}

export function useRender(): () => void {
  const element = CONTEXT.element;
  const template = CONTEXT.template;
  return () => {
    let el = element as Element;
    if (element instanceof ShadowRoot) {
      el = element.host;
    }
    if ((el as CustomElement).requestRender) {
      (el as CustomElement).requestRender();
    } else {
      render(template, element);
    }
  };
}

export function useState<T>(initialValue: T): [T, (newValue: T) => void] {
  const { get, has, set } = getReflections(CONTEXT.element);
  const requestRender = useRender();
  const index = CONTEXT.hookIndex;

  if (!has(STATE_HOOK, index)) {
    set(STATE_HOOK, index, initialValue);
  }

  const state = get(STATE_HOOK, index) as T;
  const setter = (newValue: T) => {
    set(STATE_HOOK, index, newValue);
    requestRender();
  };

  CONTEXT.hookIndex++;
  return [state, setter];
}

export function useEffect(
  callback: () => void | (() => void),
  dependencies: any[]
): void {
  const { get, set } = getReflections(CONTEXT.element);
  const index = CONTEXT.hookIndex;

  const hasChanged = dependencies.some(
    (dep, i) => dep !== get(STATE_HOOK, index)?.[i]
  );

  if (dependencies === undefined || hasChanged) {
    get(EFFECT_HOOK, index)?.();
    set(EFFECT_HOOK, index, callback());
    set(STATE_HOOK, index, dependencies);
  }

  CONTEXT.hookIndex++;
}
