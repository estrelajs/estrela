import { EventEmitter } from '../observables/event_emitter';

export function emitter<T>(isAsync?: boolean) {
  return new EventEmitter<T>(isAsync);
}
