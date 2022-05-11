import { PluginObj } from '@babel/core';
import * as t from '@babel/types';
import functionalTransform from './functional.transform';
import jsxTransform from './jsx.transform';

export default function (): PluginObj {
  return {
    name: 'babel-plugin-estrela',
    manipulateOptions(opts, parserOpts) {
      parserOpts.plugins.push('jsx');
    },
    visitor: {
      Program(path) {
        const imports = createImport(
          { h: '_jsx', createProxyState: '_$$' },
          'estrela/internal'
        );
        path.unshiftContainer('body', imports);
        path.traverse(functionalTransform());
        path.traverse(jsxTransform());
      },
    },
  };
}

function createImport(props: Record<string, string>, from: string) {
  const imports = Object.entries(props).map(([prop, alias]) => {
    const local = t.identifier(alias);
    const imported = t.identifier(prop);
    return t.importSpecifier(local, imported);
  });
  const importSource = t.stringLiteral(from);
  return t.importDeclaration(imports, importSource);
}
