import { catchError, from, Observable, of, Subscription } from 'rxjs';
import { ElementRef } from '../core/element-ref';
import { createDirective, Directive } from './directive';

class AsyncDirective implements Directive {
  private latestValue: any = null;
  private obj: Observable<any> | Promise<any> | null = null;
  private subscription: Subscription | null = null;

  private onWaiting?: any;
  private onError?: any;

  // TODO: create a Element ref that works for Component and direct template.
  constructor(private elementRef: ElementRef) {}

  transform<T>(obj: Observable<T> | Promise<T>): T | null;
  transform<T>(obj: Observable<T> | Promise<T>, onWaiting: T, onError?: T): T;
  transform(obj: null | undefined): null;
  transform(obj: any, onWaiting?: any, onError?: any): any {
    this.onWaiting = onWaiting;
    this.onError = onError;

    if (!this.obj) {
      if (obj) {
        this.subscribe(obj);
      }
      return this.latestValue;
    }

    if (obj !== this.obj) {
      this.dispose();
      return this.transform(obj, onWaiting, onError);
    }

    return this.latestValue;
  }

  dispose(): void {
    this.subscription?.unsubscribe();
    this.subscription = null;
    this.latestValue = null;
    this.obj = null;
  }

  private subscribe(obj: Observable<any> | Promise<any>) {
    this.obj = obj;
    this.subscription = from(obj)
      .pipe(
        catchError(e => {
          if (this.onError) {
            return of(this.onError);
          }
          throw e;
        })
      )
      .subscribe(value => this.updateLatestValue(obj, value));
    if (this.onWaiting) {
      this.latestValue = this.onWaiting;
    }
  }

  private updateLatestValue(async: any, value: Object): void {
    if (async === this.obj) {
      this.latestValue = value;
      this.elementRef.requestRender();
    }
  }
}

/**
 * Subscribe to a deferred context and return the current value.
 *
 * @param obj promise or observable value.
 * @param onWaiting fallback value while promise is resolving.
 * @param onError fallback value when it throws an error.
 * @returns the current state of the promise.
 */
export const async = createDirective(AsyncDirective);
