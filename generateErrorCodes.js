const fs = require('fs');
const yaml = require('js-yaml');
const toPascalcase = require('./utils/toPascalcase');
const path = require('path');

const outDir = path.resolve(process.argv[2]);

if (!process.argv[2]) {
  console.log('usage: node generateAll {outDir}');
}

const definitionFile = fs.readFileSync('./apiDefinitions.yml', {
  encoding: 'utf-8',
});

const doc = yaml.safeLoad(definitionFile);

let result = `
export namespace ErrorCode {
  export enum DefaultErrorCode {
    InternalServerError = 'InternalServerError',
  }
`;

result += Object.entries(doc).map(([serviceName, funcitonMap]) => {
  return Object.entries(funcitonMap).map(([functionName, functionContent]) => {
    const functionNameInPascalCase = toPascalcase(functionName);
    const {
      errorCodes,
    } = functionContent;
    // TODO : What if function has no errorCode?
    if (!errorCodes) {
      return undefined;
    }
    return `  export enum ${functionNameInPascalCase}ErrorCode {
${errorCodes.map(errorCode => `    ${toPascalcase(errorCode)} = '${toPascalcase(errorCode)}',`).join('\n')}
  }`;
  });
})
.reduce((acc, val) => acc.concat(val), [])
.filter((text) => {
  return text;
})
.join('\n');

result += `
}
`;

const filePath = path.join(outDir, 'ErrorCode.ts');
fs.writeFileSync(filePath, result);
