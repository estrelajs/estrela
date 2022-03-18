import { EventEmitter } from '../observables/EventEmitter';
import { CONTEXT } from '../context';

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

    const element = CONTEXT.factory.toString();
    const keys: string[] = [];

    let match: RegExpExecArray | null;
    while ((match = EMITTER_REGEX.exec(element))) {
      keys.push(match[1]);
    }

    for (const k of keys) {
      if (!Reflect.hasOwnMetadata(k, CONTEXT.instance, EMITTERS_TOKEN)) {
        key = k;
        break;
      }
    }
  }

  if (key) {
    Reflect.defineMetadata(key, emitter, CONTEXT.instance, EMITTERS_TOKEN);
  }

  return emitter;
}
