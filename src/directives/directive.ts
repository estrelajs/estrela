import { CustomElement } from '../types';
import { CONTEXT } from '../core/context';
import { render } from '../core/template/render';

type DirectiveEffect<T> = (setValue: (value: T) => void) => void | (() => void);

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

function useRender(): () => void {
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

function useState<T>(initialValue: T): [T, (newValue: T) => void] {
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

function useEffect(callback: () => void | (() => void), dependencies?: any[]): void {
  const { get, set } = getReflections(CONTEXT.element);
  const index = CONTEXT.hookIndex;

  const deps = get(STATE_HOOK, index);
  const hasChanged =
    deps === undefined ||
    dependencies === undefined ||
    dependencies.some((dep, i) => dep !== deps[i]);

  if (hasChanged) {
    get(EFFECT_HOOK, index)?.();
    set(EFFECT_HOOK, index, callback());
    set(STATE_HOOK, index, dependencies);
  }

  CONTEXT.hookIndex++;
}

/**
 * Helper function to create template directives.
 *
 * @param name unique directive name
 * @param effect effect handler for the directive
 * @param dependencies will call the effect handler on dependencies change
 * @returns the current value
 */
export function directive<T>(
  name: string,
  effect: DirectiveEffect<T>,
  dependencies: any[]
): T {
  let [result, setResult] = useState<T>(undefined as any);
  const _setResult = (newValue: T) => {
    setResult(newValue);
    result = newValue;
  };
  useEffect(() => effect(_setResult), [name, ...dependencies]);
  return result;
}
