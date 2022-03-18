import path from 'path';
import { defineConfig } from 'vite';
import estrela from 'vite-plugin-estrela';

export default defineConfig({
  resolve: {
    alias: [
      {
        find: 'estrela/directives',
        replacement: path.resolve(__dirname, '../packages/directives/index.ts'),
      },
      {
        find: 'estrela',
        replacement: path.resolve(__dirname, '../packages/index.ts'),
      },
    ],
  },
  plugins: [estrela()],
});
