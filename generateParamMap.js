const fs = require('fs-extra');
const yaml = require('js-yaml');
const toCamelCase = require('./utils/toCamelCase');
const toPascalCase = require('./utils/toPascalCase');

const definitionFile = fs.readFileSync('./apiDefinitions.yml', {
  encoding: 'utf-8',
});

const doc = yaml.safeLoad(definitionFile);

let result = `
export namespace ParamMap {
  export type BaseParamMap = {[key: string]: string};
`;



Object.entries(doc).map(([serviceName, functionMap]) => {
  Object.entries(functionMap).forEach(([functionName, functionContent]) => {
    const functionNameInPascalCase = toPascalCase(functionName);
    const {
      url,
    } = functionContent;
    // TODO : What if function has no errorCode?

    result += `
  export type ${functionNameInPascalCase}ParamMap = {
${url.split('/').filter(chunk => chunk.startsWith(':')).map(chunk => `    ${chunk.substring(1)}: string;`).join('\n')}
  };
`;
  });
});

result += '}'

async function save() {
  await fs.mkdirp('./generated/server');
  await fs.writeFile('./generated/ParamMap.ts', result);
}

save();
