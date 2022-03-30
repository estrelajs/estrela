import path from 'path';
import { defineConfig } from 'vite';
import estrela from '../vite-plugin-estrela/src/index';

export default defineConfig({
  plugins: [estrela()],
  resolve: {
    alias: [
      {
        find: 'estrela/dom',
        replacement: path.resolve(__dirname, '../estrela/src/dom'),
      },
      {
        find: 'estrela/router',
        replacement: path.resolve(__dirname, '../estrela/src/router'),
      },
      {
        find: 'estrela',
        replacement: path.resolve(__dirname, '../estrela/src/core'),
      },
    ],
  },
});
