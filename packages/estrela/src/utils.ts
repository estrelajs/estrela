/** Add event listener and return a cleanup function. */
export function addEventListener(
  node: EventTarget,
  eventName: string,
  handler: any
): () => void {
  node.addEventListener(eventName, handler);
  return () => node.removeEventListener(eventName, handler);
}

/** Apply if value is function, otherwise return value. */
export function apply<T>(value: (() => T) | T): T {
  return isFunction(value) ? value() : value;
}

/** Make array from data or return data if it's already an array. */
export function coerceArray<T>(data: T | T[]): T[] {
  return Array.isArray(data) ? (data.flat() as T[]) : [data];
}

/** Check if value is false, null or undefined. */
export function isFalsy(x: any): x is false | null | undefined {
  return x === false || x === null || x === undefined;
}

/** Check if value is a function. */
export function isFunction<Args extends Array<unknown>, R = unknown>(
  x: any
): x is (...args: Args) => R {
  return typeof x === 'function';
}

/** Check if value is null or undefined. */
export function isNil(x: any): x is null | undefined {
  return x === null || x === undefined;
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
