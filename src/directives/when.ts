import { DirectiveCallback, HTMLTemplate } from '../types';

export function when(
  condition: boolean,
  truthy: HTMLTemplate,
  falsy?: HTMLTemplate
): DirectiveCallback {
  return renderContent => renderContent(condition ? truthy : falsy);
}
