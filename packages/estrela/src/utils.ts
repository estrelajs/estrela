import { VirtualNode } from './dom';

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

/** Check if value is false, null or undefined. */
export function isFalsy(x: any): x is false | null | undefined {
  return x === false || x === null || x === undefined;
}

/** Check if value is null or undefined. */
export function isNil(x: any): x is null | undefined {
  return x === null || x === undefined;
}

/** Check if value is truthy. */
export function isTruthy<T>(x: T | false | null | undefined): x is T {
  return x !== false && x !== null && x !== undefined;
}

export function isVirtualNode(x: any): x is VirtualNode {
  return (
    x &&
    x.sel !== undefined &&
    (x.children || x.Component || x.Observable || x.text)
  );
}

// export function toCamelCase(str: string): string {
//   return str.replace(/[-_](\w)/g, (_, c) => c.toUpperCase());
// }

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
