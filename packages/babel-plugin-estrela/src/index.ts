import { PluginObj } from '@babel/core';
import { transformJSX } from './transforms/jsx.transform';
import { transformProgram } from './transforms/program.transform';
import { transformStyles } from './transforms/styles.transform';
export * from './types';

export default function (): PluginObj {
  return {
    name: 'babel-plugin-estrela',
    manipulateOptions(_, parserOpts) {
      parserOpts.plugins.push('jsx');
    },
    visitor: {
      Program: transformProgram(),
      JSXElement: transformJSX,
      JSXFragment: transformJSX,
      TaggedTemplateExpression: transformStyles,
    },
  };
}
