import { apply } from '../utils';

/**
 * Show content depending on condition.
 *
 * @param when boolean expression
 * @param truthy value or value getter when expression is true
 * @returns truthy result or undefined
 */
export function show<T>(when: boolean, truthy: T | (() => T)): T | undefined;

/**
 * Show content depending on condition.
 *
 * @param when boolean expression
 * @param truthy value or value getter when expression is true
 * @param falsy value or value getter when expression is false
 * @returns truthy/falsy result
 */
export function show<T, F>(
  when: boolean,
  truthy: T | (() => T),
  falsy: F | (() => F)
): T | F;

export function show(condition: boolean, truthy: any, falsy?: any): any {
  return condition ? apply(truthy) : apply(falsy);
}
