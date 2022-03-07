import { defineConfig } from 'rollup';
import command from 'rollup-plugin-command';
import esbuild from 'rollup-plugin-esbuild';

const getConfig = (target, output) =>
  defineConfig({
    input: {
      index: './src/index.ts',
      directives: './src/directives/index.ts',
    },
    output,
    plugins: [esbuild({ target: target }), command('tsc --emitDeclarationOnly')],
    external: Object.keys(require('./package.json').devDependencies),
  });

export default [
  getConfig('es2018', [
    {
      dir: './dist/csj',
      entryFileNames: '[name].js',
      format: 'cjs',
      sourcemap: true,
    },
    {
      dir: './dist/esm',
      entryFileNames: '[name].js',
      format: 'esm',
      sourcemap: true,
    },
  ]),
  getConfig('es2015', [
    {
      dir: './dist/es2015',
      entryFileNames: '[name].js',
      format: 'es',
      sourcemap: true,
    },
  ]),
];
