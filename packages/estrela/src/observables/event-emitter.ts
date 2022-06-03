import { Subscriber } from './subscriber';
import { Subscription } from './subscription';
import { symbol_observable } from './symbol';
import { ObservableLike, Observer } from './types';
import { coerceObserver } from './utils';

export class EventEmitter<T>
  extends Subscriber<T>
  implements ObservableLike<T>
{
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

  subscribe(
    observer?: ((value: T) => void) | Partial<Observer<T>>
  ): Subscription {
    const obs = coerceObserver(observer);
    this.observers.add(obs);
    return new Subscription(() => this.observers.delete(obs));
  }
}

export function createEventEmitter<T>(async = false): EventEmitter<T> {
  return new EventEmitter(async);
}
