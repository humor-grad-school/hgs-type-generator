const fs = require('fs');
const yaml = require('js-yaml');
const toCamelCase = require('./utils/toCamelCase');
const toPascalCase = require('./utils/toPascalCase');
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
export namespace RequestBodyType {
  export interface BaseRequestBodyType {
  }
`;

function convertTypeToString(type, space) {
  const lines =  JSON.stringify(type, null, 2)
    .replace(/'|"|,/g, '')
    .split('\n');

  lines.pop();
  lines.shift();

  return lines.map((line) => {
      line = `${' '.repeat(space)}${line}`;
      const endOfLine = line.substring(line.length - 2);
      if (endOfLine.match(/[a-z|A-Z]/)) {
        return `${line};`;
      }
      return line;
    })
    .join('\n');
}

Object.entries(doc).map(([serviceName, funcitonMap]) => {
  Object.entries(funcitonMap).forEach(([functionName, functionContent]) => {
    const functionNameInPascalCase = toPascalCase(functionName);
    const {
      requestBodyType,
    } = functionContent;
    // TODO : What if function has no errorCode?
    result += `
  export interface ${functionNameInPascalCase}RequestBodyType extends BaseRequestBodyType {
${requestBodyType ? convertTypeToString(requestBodyType, 2) : ''}
  }
`;
  })
});

result += '}'

const filePath = path.join(outDir, 'RequestBodyType.ts');
fs.writeFileSync(filePath, result);
