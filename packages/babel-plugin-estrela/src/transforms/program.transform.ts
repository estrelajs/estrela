import { NodePath, types as t } from '@babel/core';
import { State } from '../types';

export function transformProgram() {
  return {
    enter(path: NodePath<t.Program>) {
      path.state = {
        h: path.scope.generateUidIdentifier('h$'),
        template: path.scope.generateUidIdentifier('template$'),
        tmplDeclaration: t.variableDeclaration('const', []),
      } as State;
    },
    exit(path: NodePath<t.Program>) {
      const state: State = path.state;
      const imports: Record<string, string> = {};
      if (state.tmplDeclaration.declarations.length > 0) {
        const index = path.node.body.findIndex(
          node => !t.isImportDeclaration(node) && !t.isExportDeclaration(node)
        );
        path.node.body.splice(index, 0, state.tmplDeclaration);
        imports.template = state.template.name;
      }
      if (path.scope.hasBinding(state.h.name)) {
        imports.h = state.h.name;
      }
      if (Object.keys(imports).length > 0) {
        path.node.body.unshift(createImport(imports, 'estrela/template'));
      }
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
