import { Observer, SubscriberLike } from './types';

export class Subscriber<T> implements SubscriberLike<T> {
  protected observers = new Set<Observer<any>>();
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
    this.observers.forEach(observer => observer.next(value));
  }

  error(err: any): void {
    this.observers.forEach(observer => observer.error(err));
    this.observers.clear();
    this._hasError = true;
    this.thrownError = err;
  }

  complete(): void {
    this.observers.forEach(observer => observer.complete());
    this.observers.clear();
    this._closed = true;
  }
}
