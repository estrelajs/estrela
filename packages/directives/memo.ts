import { createDirective, Directive } from './directive';

class MemoDirective implements Directive {
  private computed = false;
  private deps: any[] = [];
  private lastValue: any = undefined;

  transform<T>(valueGetter: () => T, dependencies?: any[]): T {
    if (!this.computed || this.depsHaveChanged(dependencies)) {
      this.lastValue = valueGetter();
      this.computed = true;
    }
    return this.lastValue;
  }

  private depsHaveChanged(deps?: any[]): boolean {
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
 * Memoize value inside the template getter function.
 * Note that it might not work correctly in flow contexts like if/else.
 *
 * @param valueGetter getter for your memoized value
 * @param dependencies dependencies to calculate again
 * @returns memoized value
 */
export const memo = createDirective(MemoDirective);
