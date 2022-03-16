import { HTMLTemplate } from '../types';

export interface OnResult<T> {
  value?: T;
  result: HTMLTemplate;
}

export function onCase<T>(value: T, result: HTMLTemplate): OnResult<T> {
  return { value, result };
}

export function onDefault(result: HTMLTemplate): OnResult<any> {
  return { result };
}

export function switchCase<T>(
  data: T,
  ...onArgs: OnResult<T>[]
): HTMLTemplate | undefined {
  for (const arg of onArgs) {
    if (!arg.hasOwnProperty('value')) {
      return arg.result;
    } else if (data === arg.value) {
      return arg.result;
    }
  }
  return undefined;
}
