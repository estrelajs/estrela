import { EventEmitter } from '../../observables/EventEmitter';
import { CURRENT_ELEMENT } from '../token';

const EMITTER_REGEX =
  /([a-zA-Z0-9$_]+)((\s|(\/\*.*\*\/))+)?=.*emitter(<.*>)?\(.*\)/g;

export const EMITTERS_TOKEN = Symbol('EMITTERS_TOKEN');

export interface EmitterOptions {
  async?: boolean;
  key?: string;
}

export function emitter<T>({ async, key }: EmitterOptions = {}): EventEmitter<T> {
  const emitter = new EventEmitter<T>(async);

  // experimental key finder
  if (!key) {
    console.warn(
      'Warning! Prop key finder is a experimental feature and may not work for minified code.' +
        'You should manually set the key name in the "prop" options object'
    );

    const element = CURRENT_ELEMENT.element.toString();
    const keys: string[] = [];

    let match: RegExpExecArray | null;
    while ((match = EMITTER_REGEX.exec(element))) {
      keys.push(match[1]);
    }

    for (const k of keys) {
      if (!Reflect.hasOwnMetadata(k, CURRENT_ELEMENT.context, EMITTERS_TOKEN)) {
        key = k;
        break;
      }
    }
  }

  if (key) {
    Reflect.defineMetadata(key, emitter, CURRENT_ELEMENT.context, EMITTERS_TOKEN);
  }

  return emitter;
}