const fs = require('fs');
const yaml = require('js-yaml');

const definitionFile = fs.readFileSync('./apiDefinitions.yml', {
  encoding: 'utf-8',
});

const doc = yaml.safeLoad(definitionFile);

function makeFirstCharacterUppercase(string) {
  return `${string.substring(0, 1)}${string.substring(1)}`;
}

let result = `
import { ErrorCode } from './ErrorCode';

export interface IResponseType {
  isSuccessful: boolean;
  errorCode?: string;
}
`;

function convertTypeToString(type, space) {
  const lines =  JSON.stringify(type, null, 2)
    .replace(/"/g, '')
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

Object.entries(doc).forEach(([functionName, functionContent]) => {
  console.log(functionName, functionContent);
  const functionNameInPascalCase = makeFirstCharacterUppercase(functionName);
  const {
    errorCodes,
    url,
    requestBodyType,
    responseDataType,
  } = functionContent;
  result += `
export interface ${functionNameInPascalCase}ResponseType extends IResponseType {
  errorCode?: ErrorCode.${functionNameInPascalCase}ErrorCode;
  data?: {
${convertTypeToString(responseDataType, 2)}
  }
}
  `;
});

fs.writeFileSync('./ResponseType.ts', result);
