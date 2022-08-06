import { Subscriber } from './subscriber';
import { symbol_observable } from './symbol';

export class EventEmitter<T> extends Subscriber<T> {
  constructor(private _async?: boolean) {
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
}
