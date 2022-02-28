import { EventEmitter } from '../observables/event_emitter';

export const emitter = <T>(isAsync?: boolean) => new EventEmitter<T>(isAsync);
