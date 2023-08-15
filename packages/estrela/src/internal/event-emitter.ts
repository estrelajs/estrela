import { getActiveEffectMetadata } from '../signal/effect';
import { Output } from '../types';

export type Listener<T> = (value: T) => void;

export interface EventTarget {
  addEventListener(type: string, listener: Listener<unknown>): void;
  removeEventListener(type: string, listener: Listener<unknown>): void;
}

export function addEventListener(
  node: EventTarget,
  eventName: string,
  handler: Listener<any>
): () => void {
  node.addEventListener(eventName, handler);
  return () => node.removeEventListener(eventName, handler);
}

export class EventEmitter<T> {
  private readonly listeners = new Set<Listener<T>>();

  emitter: Output<T>;

  constructor() {
    const fn = this.emit.bind(this) as Output<T>;
    fn.type = 'output';
    this.emitter = fn;
  }

  addListener(listener: Listener<T>): void {
    this.listeners.add(listener);
  }

  removeListener(listener: Listener<T>): void {
    this.listeners.delete(listener);
  }

  emit(value: T): void {
    const metadata = getActiveEffectMetadata();
    if (
      !metadata ||
      metadata.options.allowEmitsOnFirstRun ||
      metadata.iteration > 0
    ) {
      Array.from(this.listeners).forEach(listener => listener(value));
    }
  }

  dispose(): void {
    this.listeners.clear();
  }
}
