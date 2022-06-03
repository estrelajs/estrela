import { PartialObserver, SubscriberLike } from './types';

export class Subscriber<T> implements SubscriberLike<T> {
  private observers = new Set<PartialObserver<T>>();
  private _closed = false;
  private _hasError = false;
  public thrownError?: any;

  get closed() {
    return this._closed;
  }

  get hasError() {
    return this._hasError;
  }

  get observed() {
    return this.observers.size > 0;
  }

  next(value: T): void {
    this.observers.forEach(observer => {
      typeof observer === 'function' ? observer(value) : observer.next?.(value);
    });
  }

  error(err: any): void {
    this.observers.forEach(
      observer => typeof observer === 'object' && observer.error?.(err)
    );
    this.observers.clear();
    this._hasError = true;
    this.thrownError = err;
  }

  complete(): void {
    this.observers.forEach(
      observer => typeof observer === 'object' && observer.complete?.()
    );
    this.observers.clear();
    this._closed = true;
  }

  protected add(observer?: PartialObserver<T>): void {
    if (observer) {
      this.observers.add(observer);
    }
  }

  protected remove(observer?: PartialObserver<T>): void {
    if (observer) {
      this.observers.delete(observer);
    }
  }
}
