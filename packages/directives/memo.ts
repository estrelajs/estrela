import { directive } from './directive';

/**
 * Memoize value inside the template getter function.
 * Note that it might not work correctly in flow contexts like if/else.
 *
 * @param valueGetter getter for your memoized value
 * @param dependencies dependencies to calculate again
 * @returns memoized value
 */
export function memo<T>(valueGetter: () => T, dependencies?: any[]) {
  return directive<T>(
    'memo',
    setValue => setValue(valueGetter()),
    dependencies ?? []
  );
}
