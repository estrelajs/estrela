import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import { defineConfig } from 'rollup';
import esbuild from 'rollup-plugin-esbuild';

const packageJson = require('../package.json');

export default defineConfig({
  input: {
    index: 'packages/index.ts',
    directives: 'packages/directives/index.ts',
  },
  output: [
    {
      dir: 'dist/csj',
      entryFileNames: '[name].js',
      format: 'cjs',
    },
    {
      dir: 'dist/esm',
      entryFileNames: '[name].js',
      format: 'esm',
    },
  ],
  plugins: [esbuild(), nodeResolve(), commonjs()],
  external: Object.keys(packageJson.peerDependencies),
});
