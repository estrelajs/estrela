import * as babel from '@babel/core';
import { Plugin } from 'vite';
import estrelaPlugin from './estrela-babel-plugin';

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
          plugins: [estrelaPlugin()],
        });
        if (result && result.code) {
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
