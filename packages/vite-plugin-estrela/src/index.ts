import * as babel from '@babel/core';
import { Plugin } from 'vite';

export interface Options {
  /** Filter files to apply babel. */
  fileRegex?: string | RegExp;
}

export default function (options?: Options): Plugin {
  let { fileRegex = /\.[jt]sx$/ } = options ?? {};
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
          plugins: ['babel-plugin-estrela'],
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
