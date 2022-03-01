export function coerceArray<T>(data: T | T[] | undefined): T[] {
  if (data === null || data === undefined) return [];
  return Array.isArray(data) ? data : [data];
}
