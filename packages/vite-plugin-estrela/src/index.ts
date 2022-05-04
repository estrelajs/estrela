import * as babel from '@babel/core';
import { Plugin } from 'vite';
import estrelaPlugin from '../../babel-plugin-estrela/src';

console.log(estrelaPlugin);

export default function (): Plugin {
  return {
    name: 'vite-plugin-estrela',
    config(config) {
      return {
        ...config,
        esbuild: {
          ...config.esbuild,
          jsx: 'preserve',
        },
      };
    },
    transform(code, id) {
      if (/\.[jt]sx$/.test(id)) {
        const result = babel.transformSync(code, {
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
