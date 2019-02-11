const fs = require('fs');
const yaml = require('js-yaml');
const toCamelCase = require('./utils/toCamelCase');
const toPascalCase = require('./utils/toPascalCase');
const path = require('path');
const convertTypeToString = require('./utils/convertTypeToString');

const outDir = path.resolve(process.argv[2]);

if (!process.argv[2]) {
  console.log('usage: node generateAll {outDir}');
}

const definitionFile = fs.readFileSync('./apiDefinitions.yml', {
  encoding: 'utf-8',
});

const doc = yaml.safeLoad(definitionFile);

let result = `
export namespace RequestBodyType {
`;

Object.entries(doc).map(([serviceName, funcitonMap]) => {
  Object.entries(funcitonMap).forEach(([functionName, functionContent]) => {
    const functionNameInPascalCase = toPascalCase(functionName);
    const {
      requestBodyType,
    } = functionContent;
    if (!requestBodyType) {
      return;
    }
    // TODO : What if function has no errorCode?
    result += `
  export interface ${functionNameInPascalCase}RequestBodyType {
${convertTypeToString(requestBodyType, 2)}
  }
`;
  })
});

result += `}
`;

const filePath = path.join(outDir, 'RequestBodyType.ts');
fs.writeFileSync(filePath, result);
