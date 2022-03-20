import { apply } from '../utils';

interface Case<T, R> {
  case: T | T[];
  result: R | ((value: T) => R);
  type: 'case';
}

interface DefaultCase<T, R> {
  result: R | ((value: T) => R);
  type: 'default';
}

/**
 * Conditional render the value in template according to the given cases.
 *
 * @param value value to test
 * @param case1 case testing created by `onCase()`
 * @param defaultCase optional default case created by `onDefault()`
 * @returns the rendererd value
 *
 * @example
 *
 * <div class="content">
 *   {
 *     switchCase(
 *       tab,
 *       onCase('main', <div>Main Tab</div>),
 *       onCase(['tab1', 'tab2', 'tab3'], (tab) => getTabContent(tab)),
 *       onDefault(<div>Tab not found!</div>)
 *     )
 *   }
 * </div>
 */
export function switchCase<T, R, D = undefined>(
  value: T,
  case1: Case<T, R>,
  defaultCase?: DefaultCase<T, D>
): R | D;
export function switchCase<T, R1, R2, D = undefined>(
  value: T,
  case1: Case<T, R1>,
  case2: Case<T, R2>,
  defaultCase?: DefaultCase<T, D>
): R1 | R2 | D;
export function switchCase<T, R1, R2, R3, D = undefined>(
  value: T,
  case1: Case<T, R1>,
  case2: Case<T, R2>,
  case3: Case<T, R3>,
  defaultCase?: DefaultCase<T, D>
): R1 | R2 | R3 | D;
export function switchCase<T, R1, R2, R3, R4, D = undefined>(
  value: T,
  case1: Case<T, R1>,
  case2: Case<T, R2>,
  case3: Case<T, R3>,
  case4: Case<T, R4>,
  defaultCase?: DefaultCase<T, D>
): R1 | R2 | R3 | R4 | D;
export function switchCase<T, R1, R2, R3, R4, R5, D = undefined>(
  value: T,
  case1: Case<T, R1>,
  case2: Case<T, R2>,
  case3: Case<T, R3>,
  case4: Case<T, R4>,
  case5: Case<T, R5>,
  defaultCase?: DefaultCase<T, D>
): R1 | R2 | R3 | R4 | R5 | D;
export function switchCase<T, R1, R2, R3, R4, R5, R6, D = undefined>(
  value: T,
  case1: Case<T, R1>,
  case2: Case<T, R2>,
  case3: Case<T, R3>,
  case4: Case<T, R4>,
  case5: Case<T, R5>,
  case6: Case<T, R6>,
  defaultCase?: DefaultCase<T, D>
): R1 | R2 | R3 | R4 | R5 | R6 | D;
export function switchCase<T, R1, R2, R3, R4, R5, R6, R7, D = undefined>(
  value: T,
  case1: Case<T, R1>,
  case2: Case<T, R2>,
  case3: Case<T, R3>,
  case4: Case<T, R4>,
  case5: Case<T, R5>,
  case6: Case<T, R6>,
  case7: Case<T, R7>,
  defaultCase?: DefaultCase<T, D>
): R1 | R2 | R3 | R4 | R5 | R6 | R7 | D;
export function switchCase<T, R1, R2, R3, R4, R5, R6, R7, R8, D = undefined>(
  value: T,
  case1: Case<T, R1>,
  case2: Case<T, R2>,
  case3: Case<T, R3>,
  case4: Case<T, R4>,
  case5: Case<T, R5>,
  case6: Case<T, R6>,
  case7: Case<T, R7>,
  case8: Case<T, R8>,
  defaultCase?: DefaultCase<T, D>
): R1 | R2 | R3 | R4 | R5 | R6 | R7 | R8 | D;
export function switchCase<T, R1, R2, R3, R4, R5, R6, R7, R8, R9, D = undefined>(
  value: T,
  case1: Case<T, R1>,
  case2: Case<T, R2>,
  case3: Case<T, R3>,
  case4: Case<T, R4>,
  case5: Case<T, R5>,
  case6: Case<T, R6>,
  case7: Case<T, R7>,
  case8: Case<T, R8>,
  case9: Case<T, R9>,
  defaultCase?: DefaultCase<T, D>
): R1 | R2 | R3 | R4 | R5 | R6 | R7 | R8 | R9 | D;

export function switchCase(
  value: any,
  ...cases: (Case<any, any> | DefaultCase<any, any> | undefined)[]
): any {
  for (const arg of cases) {
    if (!arg) {
      continue;
    }
    if (arg.type === 'default') {
      return arg.result;
    }
    if (
      arg.case === value ||
      (Array.isArray(arg.case) && arg.case.includes(value))
    ) {
      return apply(arg.result, value);
    }
  }
  return undefined;
}

/**
 * Switch case logic.
 *
 * @param value case value
 * @param result result for the current case. It can be a value or a value getter function
 * @returns Case Object
 */
export function onCase<T, R>(value: T | T[], result: R): Case<T, R> {
  return { case: value, result, type: 'case' };
}

/**
 * Default case logic.
 *
 * @param result result when cases doesn't match. It can be a value or a value getter function
 * @returns Default Case Object
 */
export function onDefault<T, R>(result: R): DefaultCase<T, R> {
  return { result, type: 'default' };
}
