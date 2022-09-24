import { types as t } from '@babel/core';

export interface State {
  h: t.Identifier;
  tmplDeclaration: t.VariableDeclaration;
  template: t.Identifier;
}
