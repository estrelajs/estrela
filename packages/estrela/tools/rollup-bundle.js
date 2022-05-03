const fs = require('fs');
const loadConfigFile = require('rollup/dist/loadConfigFile');
const path = require('path');
const rollup = require('rollup');
const { exec } = require('child_process');

loadConfigFile(path.resolve(__dirname, 'rollup.config.js'), {
  format: 'es',
}).then(async ({ options }) => {
  for await (const optionsObj of options) {
    const bundle = await rollup.rollup(optionsObj);
    await Promise.all(optionsObj.output.map(bundle.write));
  }

  // run tsc to emit declarations
  exec('tsc --emitDeclarationOnly');

  // copy README.md
  fs.copyFileSync(path.resolve(__dirname, '../../../README.md'), 'README.md');
});
