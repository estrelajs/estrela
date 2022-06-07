import { NodePath } from '@babel/core';
import * as t from '@babel/types';
import autoprefixer from 'autoprefixer';
import postcss from 'postcss';
import postcssNested from 'postcss-nested';
import postcssPrefixer from 'postcss-prefix-selector';

export function transformStyles(path: NodePath<t.TaggedTemplateExpression>) {
  const tag = path.get('tag');
  const isStyledComponent =
    tag.isCallExpression() &&
    tag.get('callee').isIdentifier({ name: 'styled' });

  if (isStyledComponent) {
    const css = path
      .get('quasi')
      .get('quasis')
      .map(quasi => quasi.node.value.cooked ?? quasi.node.value.raw)
      .join(`/*$$*/`);
    const styleId = generateStyleId();
    const processedQuasis = processCss(css, styleId)
      .split(`/*$$*/`)
      .map(str => t.templateElement({ raw: str, cooked: str }));
    path.node.quasi.quasis = [
      t.templateElement({ raw: '', cooked: '' }),
      ...processedQuasis,
    ];
    path.node.quasi.expressions = [
      t.stringLiteral(styleId),
      ...path.node.quasi.expressions,
    ];
    path.skip();
  }
}

function generateStyleId(): string {
  return Math.random().toString(36).slice(2, 7);
}

function processCss(css: string, hostId: string) {
  return postcss([
    autoprefixer(),
    postcssNested(),
    postcssPrefixer({
      transform: (_, selector) => `${selector}[_${hostId}]`,
    }) as any,
  ]).process(css).css;
}