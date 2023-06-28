import { isFunction } from '../utils';
import { ComponentNode } from './component-node';
import { TemplateNode } from './template-node';

export type EstrelaComponent = () => TemplateNode;

export interface EstrelaNode {
  template: EstrelaComponent | HTMLTemplateElement;
  props: EstrelaProps;

  get firstChild(): Node | null;
  get isConnected(): boolean;

  mount(parent: Node, before?: Node | null): Node[];
  patchProps(props: EstrelaProps): void;
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

export function isEstrelaNode(node: unknown): node is EstrelaNode {
  return node instanceof ComponentNode || node instanceof TemplateNode;
}

export function template(html: string): HTMLTemplateElement {
  const template = document.createElement('template');
  template.innerHTML = html;
  return template;
}