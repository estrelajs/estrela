import { DirectiveCallback, HTMLTemplate } from '../types';

export interface OnResult<T> {
  value?: T;
  result: HTMLTemplate;
}

export function on<T>(value: T, result: HTMLTemplate): OnResult<T> {
  return { value, result };
}

export function onDefault(result: HTMLTemplate): OnResult<any> {
  return { result };
}

export function switchRender<T>(
  data: T,
  ...onArgs: OnResult<T>[]
): DirectiveCallback {
  return render => {
    for (const arg of onArgs) {
      if (!arg.hasOwnProperty('value')) {
        return render(arg.result);
      } else if (data === arg.value) {
        return render(arg.result);
      }
    }
  };
}
