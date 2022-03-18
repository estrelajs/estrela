/**
 *
 * @param condition boolean expression
 * @param truthy value or value getter when expression is true
 * @returns truthy result or undefined
 */
export function when<T>(condition: boolean, truthy: T): T | undefined;

/**
 *
 * @param condition boolean expression
 * @param truthy value or value getter when expression is true
 * @param falsy value or value getter when expression is false
 * @returns truthy/falsy result
 */
export function when<T, F>(condition: boolean, truthy: T, falsy: F): T | F;

export function when(condition: boolean, truthy: any, falsy?: any): any {
  return condition ? truthy : falsy;
}
