const fs = require('fs');
const execAsync = require('./utils/execAsync');
const path = require('path');

const outDir = path.resolve(process.argv[2]);

if (!process.argv[2]) {
  console.log('usage: node generateAll {outDir}');
}

let isRunning = false;

async function runGenerate() {
  if (isRunning) {
    return;
  }

  isRunning = true;
  console.log('generate!');
  await execAsync(`node ${__dirname}/generateAll ${outDir}`);
  isRunning = false;
}

fs.watch(__dirname, async (event, filename) => {
  if (filename === 'apiDefinitions.yml'
    || (filename.startsWith('generate') && filename.endsWith('.js'))) {
    await runGenerate();
  }
});

runGenerate();
