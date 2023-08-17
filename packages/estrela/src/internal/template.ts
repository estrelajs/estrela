import { EstrelaComponent } from '../types';
import { isFunction } from '../utils';
import { ComponentNode } from './component-node';
import { TemplateNode } from './template-node';

export function h(
  template: EstrelaComponent | HTMLTemplateElement,
  props: Record<string, unknown>,
  key?: string
): JSX.Element {
  if (isFunction(template)) {
    return new ComponentNode(template, props, key);
  }
  return new TemplateNode(template, props, key);
}

/** Wheather the node is of the given template. */
export function isComponentOf(
  node: unknown,
  component: EstrelaComponent
): node is JSX.Element {
  return node instanceof ComponentNode && node.template === component;
}

/** Wheather the node is a template or component. */
export function isJsxElement(node: unknown): node is JSX.Element {
  return node instanceof ComponentNode || node instanceof TemplateNode;
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
