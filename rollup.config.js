import { defineConfig } from 'rollup';
import command from 'rollup-plugin-command';
import esbuild from 'rollup-plugin-esbuild';
import copy from 'rollup-plugin-copy';

const directivesPackage = `{
  "name": "estrela/directives",
  "main": "../csj/directives.js",
  "module": "../esm/directives.js",
  "ES2015": "../es2015/directives.js",
  "types": "../types/directives/index.d.ts"
}`;

const getConfig = (target, output, plugins = []) =>
  defineConfig({
    input: {
      index: './src/index.ts',
      directives: './src/directives/index.ts',
    },
    output,
    plugins: [esbuild({ target: target }), ...plugins],
    external: Object.keys(require('./package.json').devDependencies),
  });

export default [
  getConfig('es2015', {
    dir: './dist/es2015',
    entryFileNames: '[name].js',
    format: 'es',
    sourcemap: true,
  }),
  getConfig('es2018', {
    dir: './dist/csj',
    entryFileNames: '[name].js',
    format: 'cjs',
    sourcemap: true,
  }),
  getConfig(
    'es2018',
    {
      dir: './dist/esm',
      entryFileNames: '[name].js',
      format: 'esm',
      sourcemap: true,
    },
    [
      command('tsc --emitDeclarationOnly'),
      command(`mkdir dist/directives`),
      command(`echo '${directivesPackage}' > dist/directives/package.json`),
      copy({
        targets: [
          {
            src: ['package.json', 'LICENSE', 'README.md', 'CHANGELOG.md'],
            dest: 'dist',
          },
        ],
      }),
    ]
  ),
];
