import { ElementRef } from '../element-ref';
import { EventEmitter } from '../observables/EventEmitter';

const EMITTER_REGEX =
  /([a-zA-Z0-9$_]+)((\s|(\/\*.*\*\/))+)?=.*emitter(<.*>)?\(.*\)/g;

export const EMITTERS_TOKEN = Symbol('EMITTERS_TOKEN');

export interface EmitterOptions {
  async?: boolean;
  key?: string;
}

export function emitter<T>({ async, key }: EmitterOptions = {}): EventEmitter<T> {
  const ref = ElementRef.ref;

  if (!ref?.element || !ref?.component) {
    throw new Error(
      'Out of context error! You cannot create emitter from outside of a component scope.'
    );
  }

  const emitter = new EventEmitter<T>(async);

  // experimental key finder
  if (!key) {
    console.warn(
      'Warning! Prop key finder is a experimental feature and may not work for minified code.' +
        'You should manually set the key name in the "prop" options object'
    );

    const element = ref.component.toString();
    const keys: string[] = [];

    let match: RegExpExecArray | null;
    while ((match = EMITTER_REGEX.exec(element))) {
      keys.push(match[1]);
    }

    for (const k of keys) {
      if (!Reflect.hasOwnMetadata(k, ref.element, EMITTERS_TOKEN)) {
        key = k;
        break;
      }
    }
  }

  if (key) {
    Reflect.defineMetadata(key, emitter, ref.element, EMITTERS_TOKEN);
  }

  return emitter;
}
