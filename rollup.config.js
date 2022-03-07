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

const getConfig = (target, output) =>
  defineConfig({
    input: {
      index: './src/index.ts',
      directives: './src/directives/index.ts',
    },
    output,
    plugins: [
      esbuild({ target: target }),
      command('tsc --emitDeclarationOnly'),
      command(`mkdir -p dist/directives`),
      command(`echo '${directivesPackage}' > dist/directives/package.json`),
      copy({
        targets: [
          {
            src: ['package.json', 'LICENSE', 'README.md', 'CHANGELOG.md'],
            dest: 'dist',
          },
        ],
      }),
    ],
    external: Object.keys(require('./package.json').devDependencies),
  });

export default [
  getConfig('es2015', {
    dir: './dist/es2015',
    entryFileNames: '[name].js',
    format: 'es',
    sourcemap: true,
  }),
  getConfig('es2020', [
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
];
