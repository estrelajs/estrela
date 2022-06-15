import { Subscriber } from './subscriber';
import { Subscription } from './subscription';
import { symbol_observable } from './symbol';
import { PartialObserver, Subscribable } from './types';

export class EventEmitter<T> extends Subscriber<T> implements Subscribable<T> {
  constructor(private _async: boolean) {
    super();
  }

  [symbol_observable]() {
    return this;
  }

  emit(next: T): T {
    this.next(next);
    return next;
  }

  next(value: any) {
    if (this._async) {
      setTimeout(() => super.next(value));
    } else {
      super.next(value);
    }
  }

  subscribe(observer?: PartialObserver<T>): Subscription {
    this.add(observer);
    return new Subscription(() => this.remove(observer));
  }
}

export function createEventEmitter<T>(async = false): EventEmitter<T> {
  return new EventEmitter(async);
}
