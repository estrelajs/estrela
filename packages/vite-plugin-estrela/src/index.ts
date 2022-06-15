import * as babel from '@babel/core';
import { Plugin } from 'vite';
import { Options as BabelOptions } from '../../babel-plugin-estrela/src';

export interface Options extends BabelOptions {
  /** Filter files to apply babel. */
  fileRegex?: string | RegExp;
}

export default function (options?: Options): Plugin {
  let { fileRegex = /\.[jt]sx$/, ...babelOptions } = options ?? {};
  if (typeof fileRegex === 'string') {
    fileRegex = new RegExp(fileRegex);
  }

  return {
    name: 'vite-plugin-estrela',
    config() {
      return {
        esbuild: {
          jsx: 'preserve',
        },
        resolve: {
          dedupe: ['estrela/internal'],
        },
      };
    },
    transform(code, id) {
      if ((fileRegex as RegExp).test(id)) {
        const result = babel.transformSync(code, {
          filename: id,
          sourceMaps: true,
          sourceType: 'module',
          plugins: [['babel-plugin-estrela', babelOptions]],
        });
        if (result?.code) {
          return {
            code: result.code,
            map: result.map,
          };
        }
      }
      return code;
    },
  };
}
