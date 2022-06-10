import { declare } from '@babel/helper-plugin-utils';
import { transformComponent } from './transforms/component.transform';
import { transformJSX } from './transforms/jsx.transform';
import { transformProgram } from './transforms/program.transform';
import { transformStyles } from './transforms/styles.transform';
import { Options } from './types';
export * from './types';

export default declare((api, options: Options) => {
  const {
    autoDeclareStates = true,
    enableGetStateFunction = true,
    getStateWithDolarSuffix = true,
  } = options ?? {};
  return {
    name: 'babel-plugin-estrela',
    manipulateOptions(opts, parserOpts) {
      parserOpts.plugins.push('jsx');
    },
    visitor: {
      Program: transformProgram({
        autoDeclareStates,
        enableGetStateFunction,
        getStateWithDolarSuffix,
      }),
      // Function: transformComponent,
      JSXElement: transformJSX,
      JSXFragment: transformJSX,
      TaggedTemplateExpression: transformStyles,
    },
  };
});
