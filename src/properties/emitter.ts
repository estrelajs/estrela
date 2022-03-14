import { EventEmitter } from '../observables/event_emitter';
import { CURRENT_ELEMENT, ELEMENT_EMITTERS } from './tokens';

const EMITTER_REGEX =
  /([a-zA-Z0-9$_]+)((\s|(\/\*.*\*\/))+)?=.*emitter(<.*>)?\(.*\)/g;

export interface EmitterOptions {
  async?: boolean;
  key?: string;
}

export function emitter<T>({ async, key }: EmitterOptions = {}): EventEmitter<T> {
  const emitter = new EventEmitter<T>(async);

  // find key
  if (!key) {
    const element = CURRENT_ELEMENT.element.toString();
    const keys: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = EMITTER_REGEX.exec(element))) {
      keys.push(match[1]);
    }
    for (const k of keys) {
      if (!ELEMENT_EMITTERS.has(k)) {
        key = k;
        break;
      }
    }
  }

  if (key) {
    ELEMENT_EMITTERS.set(key, emitter);
  }

  return emitter;
}
