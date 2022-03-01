import path from 'path';

export default {
  resolve: {
    alias: [
      { find: '@estrela', replacement: path.resolve(__dirname, '../src/index.ts') },
    ],
  },
  // ...
};
