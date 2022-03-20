import { CONTEXT } from '../core/context';
import { render } from '../core/template/render';
import { CustomElement } from '../types';

export interface Directive {
  dispose?(): void;
  transform(...args: any[]): any;
}

export function createDirective<T extends Directive>(
  Klass: new (requestRender: () => void) => T
) {
  const directive = (...args: any[]) => {
    const requestRender = useRender();
    let [instance, setInstance] = useDirective<T | undefined>(undefined);
    if (instance === undefined || !(instance instanceof Klass)) {
      instance?.dispose?.();
      instance = new Klass(requestRender);
      setInstance(instance);
    }
    return instance.transform.apply(instance, args);
  };
  return directive as T['transform'];
}

const DIRECTIVE_HOOK = Symbol('DIRECTIVE_HOOK');

function getStateReflections<T>() {
  const element = CONTEXT.element;
  const index = CONTEXT.directiveIndex;
  const getState = () => Reflect.getOwnMetadata(index, element, DIRECTIVE_HOOK) as T;
  const hasState = () => Reflect.hasOwnMetadata(index, element, DIRECTIVE_HOOK);
  const setState = (value: T) =>
    Reflect.defineMetadata(index, value, element, DIRECTIVE_HOOK);
  return { getState, hasState, setState };
}

function useDirective<T>(initialValue: T | (() => T)): [T, (newValue: T) => void] {
  const { getState, hasState, setState } = getStateReflections<T>();
  const requestRender = useRender();
  if (!hasState()) {
    const value =
      typeof initialValue === 'function'
        ? (initialValue as () => T)()
        : initialValue;
    setState(value);
  }
  const state = getState();
  const setter = (newValue: T) => {
    setState(newValue);
    requestRender();
  };
  CONTEXT.directiveIndex++;
  return [state, setter];
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
