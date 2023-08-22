import { EstrelaComponent } from '../types';
import { EstrelaTemplate } from './estrela-template';

export function h(
  template: EstrelaComponent | HTMLTemplateElement,
  props: Record<string, unknown>,
  key?: string
): EstrelaTemplate {
  return new EstrelaTemplate(template, props, key);
}

/** Wheather the node is of the given template. */
export function isComponentOf(
  node: unknown,
  component: EstrelaComponent
): node is EstrelaTemplate {
  return node instanceof EstrelaTemplate && node.template === component;
}

/**
 * Converts an HTML string to a template to be used in JSX Element.
 * @param html HTML string to be converted to a template.
 * @returns HTMLTemplateElement.
 */
export function template(html: string): HTMLTemplateElement {
  const template = document.createElement('template');
  template.innerHTML = html;
  return template;
}
