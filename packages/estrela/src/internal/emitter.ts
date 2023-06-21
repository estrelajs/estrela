import { Output } from '../jsx';

export type Listener<T> = (value: T) => void;

export class Emitter<T> {
  private listener: Listener<T> = () => {};

  emitter: Output<T>;

  constructor() {
    const fn = this.emit.bind(this) as Output<T>;
    fn.type = 'output';
    this.emitter = fn;
  }

  setListener(listener: Listener<T>): void {
    this.listener = listener;
  }

  emit(value: T): void {
    this.listener(value);
  }
}
