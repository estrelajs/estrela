import {
  identity,
  ObjectUnsubscribedError,
  Observable,
  OperatorFunction,
  startWith,
  Subject,
  UnaryFunction,
} from 'rxjs';

export interface StateSubject<T> extends Subject<T> {
  /** Current state value. */
  (): T;

  /**
   * Updates the current state.
   * @param value next value.
   */
  next(value: T): void;

  /**
   * Updates the current state based on the last value.
   * @param updater callback function to update current state.
   */
  update(updater: (value: T) => T): void;
}

class StateSubject_ extends Subject<any> {
  constructor(private _value: any) {
    super();

    const valueGetter: any = function () {
      const { hasError, thrownError, _value } = valueGetter;
      if (hasError) {
        throw thrownError;
      }
      valueGetter._throwIfClosed();
      return _value;
    };

    const proto = Object.getPrototypeOf(this);
    Object.assign(proto, {
      apply: valueGetter.apply,
      bind: valueGetter.bind,
      call: valueGetter.call,
      toString: valueGetter.toString,
    });
    Object.setPrototypeOf(valueGetter, proto);
    Object.assign(valueGetter, this);

    return valueGetter;
  }

  next(value: any): void {
    this._value = value;
    super.next(this._value);
  }

  update(updater: (value: any) => any): void {
    this._value = updater(this._value);
    super.next(this._value);
  }

  pipe(...operations: OperatorFunction<any, any>[]): Observable<any> {
    operations.unshift(startWith(this._value));
    return pipeFromArray(operations)(this);
  }

  /** @internal */
  protected _throwIfClosed() {
    if (this.closed) {
      throw new ObjectUnsubscribedError();
    }
  }
}

/** @internal */
export function pipeFromArray<T, R>(
  fns: Array<UnaryFunction<T, R>>
): UnaryFunction<T, R> {
  if (fns.length === 0) {
    return identity as UnaryFunction<any, any>;
  }

  if (fns.length === 1) {
    return fns[0];
  }

  return function piped(input: T): R {
    return fns.reduce(
      (prev: any, fn: UnaryFunction<T, R>) => fn(prev),
      input as any
    );
  };
}

export const StateSubject: {
  new <T>(value: T): StateSubject<T>;
  readonly prototype: StateSubject<any>;
} = StateSubject_ as any;
