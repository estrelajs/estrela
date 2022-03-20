import { HTMLTemplate } from '../core';
import { HTMLTemplateLike } from '../types';

/** Make sure data is an array. */
export function coerceArray<T>(data: T | T[] | null | undefined): T[] {
  const array = Array.isArray(data) ? data : [data];
  return array.filter(item => item !== null && item !== undefined) as T[];
}

/** create HTMLTemplate array from a valid template value. */
export function coerceTemplate(template: HTMLTemplateLike): HTMLTemplate[] {
  const templateArray = coerceArray(template);
  return templateArray.map(data => {
    if (data instanceof HTMLTemplate) {
      return data;
    }
    const parsed = isFalsy(data) ? '' : String(data);
    return new HTMLTemplate([parsed] as any, []);
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
