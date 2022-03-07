import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  esbuild: {
    minify: false,
    minifySyntax: true,
  },
  resolve: {
    alias: [
      {
        find: '@estrela/directives',
        replacement: path.resolve(__dirname, '../src/directives/index.ts'),
      },
      { find: '@estrela', replacement: path.resolve(__dirname, '../src/index.ts') },
    ],
  },
});
