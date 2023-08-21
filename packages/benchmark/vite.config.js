import path from 'path';
import { defineConfig } from 'vite';
import estrela from 'vite-plugin-estrela';

export default defineConfig({
  plugins: [estrela()],
  resolve: {
    alias: [
      {
        find: 'estrela/router',
        replacement: path.resolve(__dirname, '../estrela/src/router'),
      },
      {
        find: 'estrela/template',
        replacement: path.resolve(__dirname, '../estrela/src/template'),
      },
      {
        find: 'estrela',
        replacement: path.resolve(__dirname, '../estrela/src'),
      },
    ],
  },
});
