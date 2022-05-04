import { PluginObj } from '@babel/core';
import * as t from '@babel/types';
import jsxTransform from './jsx.transform';
import reactiveTransform from './reactive.transform';

export default function (): PluginObj {
  return {
    name: 'babel-plugin-estrela',
    manipulateOptions(opts, parserOpts) {
      parserOpts.plugins.push('jsx');
    },
    visitor: {
      Program(path) {
        const _$$ = createImport('createState', '_$$', 'estrela');
        const _jsx = createImport('h', '_jsx', 'estrela/dom');
        path.unshiftContainer('body', _$$);
        path.unshiftContainer('body', _jsx);
        path.traverse(reactiveTransform());
        path.traverse(jsxTransform());
      },
    },
  };
}

function createImport(prop: string, alias: string, from: string) {
  const local = t.identifier(alias);
  const imported = t.identifier(prop);
  const importSource = t.stringLiteral(from);
  const importSpecifier = t.importSpecifier(local, imported);
  return t.importDeclaration([importSpecifier], importSource);
}
