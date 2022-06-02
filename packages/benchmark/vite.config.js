import path from 'path';
import { defineConfig } from 'vite';
import estrela from 'vite-plugin-estrela';

export default defineConfig({
  // plugins: [estrela({ autoDeclareStates: false })],
  resolve: {
    alias: [
      {
        find: 'estrela/internal',
        replacement: path.resolve(__dirname, '../estrela/src/internal'),
      },
      {
        find: 'estrela/router',
        replacement: path.resolve(__dirname, '../estrela/src/router'),
      },
      {
        find: 'estrela/store',
        replacement: path.resolve(__dirname, '../estrela/src/store'),
      },
      {
        find: 'estrela',
        replacement: path.resolve(__dirname, '../estrela/src'),
      },
    ],
  },
});
