import { ElementRef } from '../core/element-ref';

export interface Directive {
  dispose?(): void;
  transform(...args: any[]): any;
}

export function createDirective<T extends Directive>(
  Klass: new (ref: ElementRef) => T
) {
  const directive = (...args: any[]) => {
    const ref = ElementRef.ref;

    if (!ref?.host) {
      throw new Error(
        'Out of context error! You cannot call a directive from outside of a render scope.'
      );
    }

    let [instance, setInstance] = useDirective<T>(ref);

    if (instance === undefined || !(instance instanceof Klass)) {
      instance?.dispose?.();
      instance = new Klass(ref);
      setInstance(instance);
    }

    return instance.transform.apply(instance, args);
  };
  return directive as T['transform'];
}

const DIRECTIVE_HOOK = Symbol('DIRECTIVE_HOOK');

function getStateReflections<T>(ref: ElementRef) {
  const host = ref.host!;
  const hook = ref.hook;
  const getState = () => Reflect.getOwnMetadata(hook, host, DIRECTIVE_HOOK) as T;
  const setState = (value: T) =>
    Reflect.defineMetadata(hook, value, host, DIRECTIVE_HOOK);
  return { getState, setState };
}

function useDirective<T>(ref: ElementRef): [T | undefined, (newValue: T) => void] {
  ref.nextHook();
  const { getState, setState } = getStateReflections<T>(ref);
  const setter = (newValue: T) => setState(newValue);
  const state = getState();
  return [state, setter];
}
