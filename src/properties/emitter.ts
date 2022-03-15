import { EventEmitter } from '../observables/event_emitter';
import { CURRENT_ELEMENT } from '../element/token';

const EMITTER_REGEX =
  /([a-zA-Z0-9$_]+)((\s|(\/\*.*\*\/))+)?=.*emitter(<.*>)?\(.*\)/g;

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
      if (!Reflect.hasOwnMetadata(k, CURRENT_ELEMENT.context, 'emitters')) {
        key = k;
        break;
      }
    }
  }

  if (key) {
    Reflect.defineMetadata(key, emitter, CURRENT_ELEMENT.context, 'emitters');
  }

  return emitter;
}
