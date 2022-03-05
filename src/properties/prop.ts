import { StateSubject } from '../observables';
import { CURRENT_ELEMENT, ELEMENT_PROPS } from './tokens';

const PROP_REGEX =
  /([a-zA-Z0-9$_]+)(\s|(\/\*.*\*\/))+?=(\s|(\/\*.*\*\/))+?prop(<.*>)?\(.*\)/g;

export function prop<T>(): StateSubject<T | undefined>;
export function prop<T>(initialValue: T): StateSubject<T>;
export function prop<T>(
  initialValue?: T,
  options?: { key?: string }
): StateSubject<T | undefined>;
export function prop(
  initialValue?: any,
  { key }: { key?: string } = {}
): StateSubject<any> {
  const state = new StateSubject<any>(initialValue);

  // find key
  if (!key) {
    const element = CURRENT_ELEMENT.element.toString();
    const keys: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = PROP_REGEX.exec(element))) {
      keys.push(match[1]);
    }
    for (const k of keys) {
      if (!ELEMENT_PROPS.has(k)) {
        key = k;
        break;
      }
    }
  }

  if (key) {
    ELEMENT_PROPS.set(key, state);
  }

  return state;
}
