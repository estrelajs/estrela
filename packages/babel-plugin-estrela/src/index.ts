import { declare } from '@babel/helper-plugin-utils';
import * as t from '@babel/types';
import functionalTransform from './functional.transform';
import jsxTransform from './jsx.transform';
import { Options } from './options';
import styledTransform from './styled.transform';

export type { Options } from './options';

export default declare((api, options: Options) => {
  const { autoDeclareStates = true } = options;

  return {
    name: 'babel-plugin-estrela',
    manipulateOptions(opts, parserOpts) {
      parserOpts.plugins.push('jsx');
    },
    visitor: {
      Program(path) {
        const imports = createImport(
          {
            h: '_jsx',
            $$: '_$$',
          },
          'estrela/internal'
        );
        path.unshiftContainer('body', imports);
        if (autoDeclareStates) {
          path.traverse(functionalTransform(options));
        }
        path.traverse(jsxTransform());
        path.traverse(styledTransform());
      },
    },
  };
});

function createImport(props: Record<string, string>, from: string) {
  const imports = Object.entries(props).map(([prop, alias]) => {
    const local = t.identifier(alias);
    const imported = t.identifier(prop);
    return t.importSpecifier(local, imported);
  });
  const importSource = t.stringLiteral(from);
  return t.importDeclaration(imports, importSource);
}
