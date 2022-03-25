import { ElementRef } from '../element-ref';
import { StateSubject } from '../observables/StateSubject';

const PROP_REGEX = /([a-zA-Z0-9$_]+)((\s|(\/\*.*\*\/))+)?=.*prop(<.*>)?\(.*\)/g;

export const PROPS_TOKEN = Symbol('PROPS_TOKEN');

export interface PropOptions<T> {
  /** The prop key to be bound on the element tag. */
  key?: string;
}

export function prop<T>(): StateSubject<T | undefined>;
export function prop<T>(initialValue: T, options?: PropOptions<T>): StateSubject<T>;
export function prop(value?: any, options?: PropOptions<any>): StateSubject<any> {
  const ref = ElementRef.ref;

  if (!ref?.element || !ref?.component) {
    throw new Error(
      'Out of context error! You cannot create prop from outside of a component scope.'
    );
  }

  let { key } = options ?? {};
  const state = new StateSubject<any>(value);

  // experimental key finder
  if (!key) {
    console.warn(
      'Warning! Prop key finder is a experimental feature and may not work for minified code.' +
        'You should manually set the key name in the "prop" options object'
    );

    const element = ref.component.toString();
    const keys: string[] = [];

    let match: RegExpExecArray | null;
    while ((match = PROP_REGEX.exec(element))) {
      keys.push(match[1]);
    }

    for (const k of keys) {
      if (!Reflect.hasOwnMetadata(k, ref.element, PROPS_TOKEN)) {
        key = k;
        break;
      }
    }
  }

  if (key) {
    Reflect.defineMetadata(key, state, ref.element, PROPS_TOKEN);
  }

  return state;
}
