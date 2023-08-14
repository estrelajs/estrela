import { isFunction } from '../utils';
import { ComponentNode } from './component-node';
import { Listener } from './event-emitter';
import { TemplateNode } from './template-node';

export interface EstrelaComponent extends Function {
  (): TemplateNode;
}

export interface EstrelaNode {
  template: EstrelaComponent | HTMLTemplateElement;
  props: EstrelaProps;

  get firstChild(): Node | null;
  get isConnected(): boolean;

  addEventListener(event: string, listener: Listener<unknown>): void;
  removeEventListener(event: string, listener: Listener<unknown>): void;
  patchProps(props: EstrelaProps): void;
  mount(parent: Node, before?: Node | null): Node[];
  unmount(): void;
}

export type EstrelaProps = Record<string, unknown>;

export function h(
  template: EstrelaComponent | HTMLTemplateElement,
  props: EstrelaProps
): EstrelaNode {
  if (isFunction(template)) {
    return new ComponentNode(template, props);
  }
  return new TemplateNode(template, props);
}

/** Wheather the node is of the given template. */
export function isComponentOf(
  node: unknown,
  component: EstrelaComponent
): node is EstrelaNode {
  return node instanceof ComponentNode && node.template === component;
}

/** Wheather the node is a template or component. */
export function isEstrelaNode(node: unknown): node is EstrelaNode {
  return node instanceof ComponentNode || node instanceof TemplateNode;
}

/**
 * Converts an HTML string to a template to be used in EstrelaNode.
 * @param html HTML string to be converted to a template.
 * @returns HTMLTemplateElement.
 */
export function template(html: string): HTMLTemplateElement {
  const template = document.createElement('template');
  template.innerHTML = html;
  return template;
}
