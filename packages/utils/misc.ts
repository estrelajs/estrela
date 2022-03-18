import { HTMLResult } from '../core';
import { HTMLTemplate } from '../types';

/** Make sure data is an array. */
export function coerceArray<T>(data: T | T[] | null | undefined): T[] {
  const array = Array.isArray(data) ? data : [data];
  return array.filter(item => item !== null && item !== undefined) as T[];
}

/** create HtmlResult from a valid template value. */
export function coerceTemplate(template: HTMLTemplate): HTMLResult[] {
  const templateArray = coerceArray(template);
  return templateArray.map(data => {
    if (data instanceof HTMLResult) {
      return data;
    }
    const parsed = isFalsy(data) ? '' : String(data);
    return new HTMLResult([parsed] as any, []);
  });
}

/** Check if value is false, null or undefined. */
export function isFalsy(x: any): x is false | null | undefined {
  return x === false || x === null || x === undefined;
}

/** Check if value is null or undefined. */
export function isNil(x: any): x is null | undefined {
  return x === null || x === undefined;
}