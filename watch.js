const fs = require('fs');
const execAsync = require('./utils/execAsync');

let isRunning = false;

async function runGenerate() {
  if (isRunning) {
    return;
  }

  isRunning = true;
  console.log('generate!');
  await execAsync('node generateAll');
  isRunning = false;
}

fs.watch(__dirname, async (event, filename) => {
  if (filename === 'apiDefinitions.yml'
    || (filename.startsWith('generate') && filename.endsWith('.js'))) {
    await runGenerate();
  }
});

runGenerate();
