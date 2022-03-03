export function coerceArray<T>(data: T | T[] | null | undefined): T[] {
  const array = Array.isArray(data) ? data : [data];
  return array.filter(item => item !== null && item !== undefined) as T[];
}
