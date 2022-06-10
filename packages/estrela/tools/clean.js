const fs = require('fs-extra');
const path = require('path');

const folders = ['dist', 'internal', 'router', 'README.md'];

folders.forEach(folder => {
  fs.removeSync(path.resolve(__dirname, '..', folder));
});
