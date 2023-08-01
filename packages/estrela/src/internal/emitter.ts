import { Output } from '../jsx';
import { getActiveEffectMetadata } from '../signal/effect';

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
    const metadata = getActiveEffectMetadata();
    if (
      !metadata ||
      metadata.options.allowEmitsOnFirstRun ||
      metadata.iteration > 0
    ) {
      this.listener(value);
    }
  }
}
