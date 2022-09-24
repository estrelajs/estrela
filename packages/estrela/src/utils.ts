/** automatic event value binding. */
export function bindHandler<T, R>(event: Event & { target: T }): R {
  return (event.target as any).value;
}

/** Make array from data or return data if it's already an array. */
export function coerceArray<T>(data: T | T[]): T[] {
  return Array.isArray(data) ? data : [data];
}

/** Identity function. Returns the first param. */
export function identity<T>(...args: any[]): T {
  return args[0];
}

/** Check if value is false, null or undefined. */
export function isFalsy(x: any): x is false | null | undefined {
  return x === false || x === null || x === undefined;
}

/** Check if value is a function. */
export function isFunction<Args extends Array<any> = [], R = any>(
  x: any
): x is (...args: Args) => R {
  return typeof x === 'function';
}

/** Check if value is null or undefined. */
export function isNil(x: any): x is null | undefined {
  return x === null || x === undefined;
}

/** Creates a throttled function that only invokes `fn` at most once per every `wait` milliseconds. */
export function throttle<T extends (...args: any) => void>(
  fn: T,
  wait?: number
): (...args: Parameters<T>) => void {
  let lastargs = [] as Parameters<T>;
  let timeout: number | null = null;
  return (...args: Parameters<T>): void => {
    lastargs = args;
    if (timeout === null) {
      timeout = window.setTimeout(() => {
        timeout = null;
        fn(lastargs);
      }, wait);
    }
  };
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
