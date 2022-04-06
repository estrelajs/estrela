/** Make array from data or return data if it's already an array. */
export function coerceArray<T>(data: T | T[]): T[] {
  return Array.isArray(data) ? data : [data];
}

/** Check if value is false, null or undefined. */
export function isFalsy(x: any): x is false | null | undefined {
  return x === false || x === null || x === undefined;
}

/** Check if value is null or undefined. */
export function isNil(x: any): x is null | undefined {
  return x === null || x === undefined;
}
