import * as babel from '@babel/core';
import { Plugin } from 'vite';
import estrelaPlugin from '../../babel-plugin-estrela/src';

export default function (): Plugin {
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
          plugins: [estrelaPlugin()],
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
