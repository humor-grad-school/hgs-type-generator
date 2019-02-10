const fs = require('fs-extra');
const path = require('path');
const execAsync = require('./utils/execAsync');

const outDir = path.resolve(process.argv[2]);

if (!process.argv[2]) {
  console.log('usage: node generateAll {outDir}');
}

async function generateAll() {
  const dir = await fs.readdir(__dirname);

  process.chdir(__dirname);

  await fs.remove(outDir);
  await fs.mkdir(outDir);

  await Promise.all(dir.map(async (filename) => {
    if (!filename.startsWith('generate') || !filename.endsWith('.js') || filename === 'generateAll.js') {
      return;
    }
    console.log(filename);
    await execAsync(`node ${filename} ${outDir}`, false);
  }));
}

generateAll().catch((err) => {
  console.error(err);
});
