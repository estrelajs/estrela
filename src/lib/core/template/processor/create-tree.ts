import { HTMLTemplate } from '../html';
import { buildAst } from './ast-builder';
import { buildHTMLTemplate } from './template-builder';
import { buildVTree } from './vtree-builder';

export function createTree(template: HTMLTemplate): VirtualDOM.VNode {
  const htmlResult = buildHTMLTemplate(template);
  const ast = buildAst(htmlResult);
  return buildVTree(ast);
}
