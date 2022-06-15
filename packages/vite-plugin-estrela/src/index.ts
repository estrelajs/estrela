import * as babel from '@babel/core';
import { Plugin } from 'vite';
import { Options } from 'babel-plugin-estrela';

export default function (options?: Options): Plugin {
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
      if (/\.[jt]sx$/.test(id)) {
        const result = babel.transformSync(code, {
          filename: id,
          sourceMaps: true,
          sourceType: 'module',
          plugins: [['babel-plugin-estrela', options]],
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
