import { NodePath } from '@babel/core';
import * as t from '@babel/types';
import { Options, State } from '../types';

export function transformProgram(options: Options) {
  return {
    enter(path: NodePath<t.Program>) {
      path.state = {
        h: path.scope.generateUidIdentifier('h'),
        stateProxy: path.scope.generateUidIdentifier('$$'),
        tmplDeclaration: t.variableDeclaration('const', []),
        template: path.scope.generateUidIdentifier('template'),
      } as State;
      (path.hub as any).file.metadata.config = options;
    },
    exit(path: NodePath<t.Program>) {
      const state: State = path.state;
      const imports: Record<string, string> = {};
      if (state.tmplDeclaration.declarations.length > 0) {
        const index = path.node.body.reduce(
          (index, node, i) =>
            t.isImportDeclaration(node) || t.isExportDeclaration(node)
              ? i
              : index,
          0
        );
        path.node.body.splice(index + 1, 0, state.tmplDeclaration);
        imports.template = state.template.name;
      }
      if (path.scope.hasBinding(state.h.name)) {
        imports.h = state.h.name;
      }
      if (path.scope.hasBinding(state.stateProxy.name)) {
        imports.$$ = state.stateProxy.name;
      }
      if (Object.keys(imports).length > 0) {
        path.node.body.unshift(createImport(imports, 'estrela/internal'));
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
