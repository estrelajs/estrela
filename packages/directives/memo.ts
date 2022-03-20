import { createDirective, Directive } from './directive';

class MemoDirective implements Directive {
  private deps?: any[];
  private lastValue: any;

  transform<T>(valueGetter: () => T, dependencies?: any[]): T {
    if (this.depsHaveChanged(dependencies)) {
      this.lastValue = valueGetter();
    }
    return this.lastValue;
  }

  private depsHaveChanged(deps?: any[]): boolean {
    if (!this.deps) {
      this.deps = [];
      return true;
    }
    if (!deps) {
      return false;
    }
    if (this.deps.length !== deps.length) {
      return true;
    }
    return this.deps.some((dep, i) => deps[i] !== dep);
  }
}

/**
 * Memoize value depending on the dependencies array change.
 *
 * @param valueGetter getter for your memoized value
 * @param dependencies dependencies to calculate again
 * @returns memoized value
 */
export const memo = createDirective(MemoDirective);
