import { EventEmitter } from './event-emitter';
import { EstrelaNode } from './internal';
import { throttle } from './utils';

const eventEmitters = new Set<EventEmitter>();
const blockedEventEmitters = new Set<EventEmitter>();

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
        eventEmitters.add(eventEmitterMap[prop]);
        return target[prop];
      },
      set(target, key, value) {
        const prop = key as keyof T;
        target[prop] = value;
        const emitter = eventEmitterMap[prop];
        blockedEventEmitters.add(emitter);
        emitter.emit();
        return true;
      },
    }
  );
}

export function createEffect(fn: () => void): Unsubscriber {
  const unsubscribers = new Set<() => void>();
  const runEffect = throttle(() => {
    eventEmitters.clear();
    blockedEventEmitters.clear();
    fn();
    eventEmitters.forEach(emitter => {
      if (!blockedEventEmitters.has(emitter)) {
        unsubscribers.add(emitter.subscribe(runEffect));
      }
    });
  });
  runEffect();
  const unsubscriber = () => {
    unsubscribers.forEach(unsubscriber => {
      unsubscriber();
      unsubscribers.delete(unsubscriber);
    });
  };
  if (EstrelaNode.ref) {
    EstrelaNode.ref.addHook('destroy', unsubscriber);
  }
  return unsubscriber;
}

export type Unsubscriber = () => void;
