/** Return value from a value or function. */
export function apply<T>(value: T | ((...args: any) => T), ...args: any[]): T {
  return typeof value === 'function'
    ? (value as Function).apply(value, args)
    : value;
}

/** Make array from data or return data if it's already an array. */
export function coerceArray<T>(data: T | T[]): T[] {
  return Array.isArray(data) ? data : [data];
}

/** Make an identity function from any value. */
export function coerceFunction<T>(value: T | (() => T)): () => T {
  return typeof value === 'function' ? (value as () => T) : () => value;
}

/** Check if objects are deep equal. */
export function deepEqual(obj1: any, obj2: any): boolean {
  if (!obj1 || !obj2 || (isPrimitive(obj1) && isPrimitive(obj2))) {
    // compare primitives
    return obj1 === obj2;
  }
  if (Object.keys(obj1).length !== Object.keys(obj2).length) {
    return false;
  }
  // compare objects with same number of keys
  for (let key in obj1) {
    if (!(key in obj2)) {
      return false; //other object doesn't have this prop
    }
    if (!deepEqual(obj1[key], obj2[key])) {
      return false;
    }
  }
  return true;
}

/** Identity function. Returns the first param. */
export function identity<T>(value: T, ...args: any[]): T {
  return value;
}

/** Check if value is false, null or undefined. */
export function isFalsy(x: any): x is false | null | undefined {
  return x === false || x === null || x === undefined;
}

/** Check if value is null or undefined. */
export function isNil(x: any): x is null | undefined {
  return x === null || x === undefined;
}

/** Check if value is primitive. */
export function isPrimitive(
  x: any
): x is string | number | boolean | symbol | null | undefined {
  return typeof x !== 'function' && typeof x !== 'object';
}

/** Check if value is truthy. */
export function isTruthy<T>(x: T | false | null | undefined): x is T {
  return x !== false && x !== null && x !== undefined;
}

/** Transform string to camelCase. */
export function toCamelCase(str: string): string {
  const s = str.replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''));
  return s[0].toLowerCase() + s.slice(1);
}

/** Transform string to kebab-case. */
export function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/\s+/g, '-')
    .toLowerCase();
}
