import { StateSubject } from '../../observables';
import { CURRENT_ELEMENT } from '../token';

const PROP_REGEX = /([a-zA-Z0-9$_]+)((\s|(\/\*.*\*\/))+)?=.*prop(<.*>)?\(.*\)/g;

export const PROPS_TOKEN = Symbol('PROPS_TOKEN');

export interface PropOptions<T> {
  /** The prop key to be bound on the element tag. */
  key?: string;

  /** Initial value to start with. */
  value?: T;
}

export function prop<T>(): StateSubject<T | undefined>;
export function prop<T>(
  options: Required<Pick<PropOptions<T>, 'value'>> & Omit<PropOptions<T>, 'value'>
): StateSubject<T>;
export function prop<T>(options?: PropOptions<T>): StateSubject<T | undefined>;
export function prop(options?: PropOptions<any>): StateSubject<any> {
  let { value, key } = options ?? {};
  const state = new StateSubject<any>(value);

  // experimental key finder
  if (!key) {
    console.warn(
      'Warning! Prop key finder is a experimental feature and may not work for minified code.' +
        'You should manually set the key name in the "prop" options object'
    );

    const element = CURRENT_ELEMENT.element.toString();
    const keys: string[] = [];

    let match: RegExpExecArray | null;
    while ((match = PROP_REGEX.exec(element))) {
      keys.push(match[1]);
    }

    for (const k of keys) {
      if (!Reflect.hasOwnMetadata(k, CURRENT_ELEMENT.context, PROPS_TOKEN)) {
        key = k;
        break;
      }
    }
  }

  if (key) {
    Reflect.defineMetadata(key, state, CURRENT_ELEMENT.context, PROPS_TOKEN);
  }

  return state;
}
