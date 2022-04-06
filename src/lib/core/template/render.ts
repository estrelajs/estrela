import { HTMLTemplate } from './html';
import { buildAst } from './processor/ast-builder';
import { buildHTMLTemplate } from './processor/template-builder';

export function render(template: HTMLTemplate, element: Element): void {
  const html = buildHTMLTemplate(template);
  const result = buildAst(html);
  console.log(result);
}
