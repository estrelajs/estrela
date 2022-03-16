import { DirectiveCallback, HTMLTemplate } from '../types';

export function when(
  condition: boolean,
  truthy: HTMLTemplate,
  falsy?: HTMLTemplate
): DirectiveCallback {
  return () => (condition ? truthy : falsy);
}
