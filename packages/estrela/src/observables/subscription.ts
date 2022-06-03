import { TeardownLogic, Unsubscribable } from './types';

export class Subscription implements Unsubscribable {
  private _closed = false;
  private _finalizers = new Set<TeardownLogic>();

  get closed() {
    return this._closed;
  }

  constructor(teardown?: TeardownLogic) {
    if (teardown) {
      this._finalizers.add(teardown);
    }
  }

  add(teardown: TeardownLogic) {
    if (!this._closed) {
      this._finalizers.add(teardown);
    }
  }

  unsubscribe() {
    if (!this.closed) {
      this._closed = true;

      if (this._finalizers.size > 0) {
        this._finalizers.forEach(finalizer => {
          if (typeof finalizer === 'function') {
            finalizer();
          } else {
            finalizer.unsubscribe();
          }
        });
        this._finalizers.clear();
      }
    }
  }
}
