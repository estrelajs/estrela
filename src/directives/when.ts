import { DirectiveCallback } from '../types';

export function when<T>(
  condition: boolean,
  truthy: T,
  falsy?: T
): DirectiveCallback<T> {
  return renderContent => renderContent(condition ? truthy : falsy);
}
