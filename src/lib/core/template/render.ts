import { HTMLTemplate } from './html';
import { buildHTMLTemplate } from './processor/template-builder';

export function render(template: HTMLTemplate, element: Element): void {
  const result = buildHTMLTemplate(template);
  console.log(result);
}
