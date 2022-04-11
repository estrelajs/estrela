import { ComponentRef } from '../dom/component-ref';

export interface Directive {
  dispose?(): void;
  transform(...args: any[]): any;
}

const HOOK_STORE = new WeakMap<ComponentRef, any[]>();

export function createDirective<T extends Directive>(
  Klass: new (ref: ComponentRef) => T
) {
  const directive = (...args: any[]) => {
    const ref = ComponentRef.currentRef;
    if (!ref) {
      throw new Error(
        'Out of context error! You cannot call a directive from outside of a render scope.'
      );
    }

    if (!HOOK_STORE.has(ref)) {
      HOOK_STORE.set(ref, []);
    }

    let [instance, setInstance] = useDirective<T>(ref);
    if (instance === undefined || !(instance instanceof Klass)) {
      instance?.dispose?.();
      instance = new Klass(ref);
      setInstance(instance);
    }

    return instance.transform.apply(instance, args);
  };

  // return directive function.
  return directive as T['transform'];
}

function useDirective<T>(
  ref: ComponentRef
): [T | undefined, (newValue: T) => void] {
  const hookIndex = ref.nextHook();
  const getState = () => HOOK_STORE.get(ref)![hookIndex] as T;
  const setState = (value: T) => (HOOK_STORE.get(ref)![hookIndex] = value);
  return [getState(), (newValue: T) => setState(newValue)];
}
