import { HTMLTemplate } from '../types';

export function when(
  condition: boolean,
  truthy: HTMLTemplate,
  falsy?: HTMLTemplate
): HTMLTemplate | undefined {
  return condition ? truthy : falsy;
}
