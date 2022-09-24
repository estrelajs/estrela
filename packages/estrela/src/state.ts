import { EventEmitter } from './event-emitter';
import { throttle } from './utils';

let eventEmitters: Array<EventEmitter> = [];

type EventEmitterMap<T extends Object> = {
  [key in keyof T]: EventEmitter;
};

export function createState<T extends Object>(initialState: T) {
  const eventEmitterMap = new Proxy<EventEmitterMap<T>>(
    {} as EventEmitterMap<T>,
    {
      get(target, key) {
        const prop = key as keyof T;
        target[prop] ??= new EventEmitter();
        return target[prop];
      },
    }
  );
  return new Proxy<T>(
    { ...initialState },
    {
      get(target, key) {
        const prop = key as keyof T;
        eventEmitters.push(eventEmitterMap[prop]);
        return target[prop];
      },
      set(target, key, value) {
        const prop = key as keyof T;
        target[prop] = value;
        eventEmitterMap[prop].emit();
        return true;
      },
    }
  );
}

export function createEffect(fn: () => void): Unsubscriber {
  const unsubscribers = new Set<() => void>();
  const runEffect = throttle(() => {
    eventEmitters = [];
    fn();
    eventEmitters.forEach(emitter => {
      unsubscribers.add(emitter.subscribe(runEffect));
    });
  });
  runEffect();
  return () => {
    unsubscribers.forEach(unsubscriber => {
      unsubscriber();
      unsubscribers.delete(unsubscriber);
    });
  };
}

export type Unsubscriber = () => void;
