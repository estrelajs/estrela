import { NodePath } from '@babel/core';
import * as t from '@babel/types';
import autoprefixer from 'autoprefixer';
import postcss from 'postcss';
import postcssNested from 'postcss-nested';
import cssParserPlugin from '../shared/css-parser-plugin';

export function transformStyles(path: NodePath<t.TaggedTemplateExpression>) {
  const tag = path.get('tag');
  const isStyledComponent =
    tag.isCallExpression() &&
    tag.get('callee').isIdentifier({ name: 'styled' });

  if (isStyledComponent) {
    const idArg = tag.get('arguments')[1];
    const styleId = idArg?.isStringLiteral()
      ? idArg.node.value
      : generateStyleId();
    tag.node.arguments[1] = t.stringLiteral(styleId);
    const css = path
      .get('quasi')
      .get('quasis')
      .map(quasi => quasi.node.value.cooked ?? quasi.node.value.raw)
      .join(`/*$$*/`);
    path.node.quasi.quasis = processCss(css, styleId)
      .split(`/*$$*/`)
      .map(str => t.templateElement({ raw: str, cooked: str }));
  }
}

function generateStyleId(): string {
  return Math.random().toString(36).slice(2, 7);
}

function processCss(css: string, hostId: string) {
  const firstPass = postcss([autoprefixer(), postcssNested()]).process(css).css;
  return postcss([cssParserPlugin({ id: `_${hostId}` })]).process(firstPass)
    .css;
}
