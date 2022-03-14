import path from 'path';
import { defineConfig } from 'vite';
import estrela from 'vite-plugin-estrela';

export default defineConfig({
  resolve: {
    alias: [
      {
        find: 'estrela/directives',
        replacement: path.resolve(__dirname, '../src/directives/index.ts'),
      },
      { find: 'estrela', replacement: path.resolve(__dirname, '../src/index.ts') },
    ],
  },
  plugins: [estrela()],
});
