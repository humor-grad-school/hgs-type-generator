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
import { ErrorCode } from './ErrorCode';
`;


result += `
export namespace ResponseDataType {
`;

Object.entries(doc).map(([serviceName, funcitonMap]) => {
  Object.entries(funcitonMap).forEach(([functionName, functionContent]) => {
    const functionNameInPascalCase = toPascalCase(functionName);
    const {
      errorCodes,
      requestBodyType,
      responseDataType,
    } = functionContent;
    if (!responseDataType) {
      return;
    }
    // TODO : What if function has no errorCode?
    result += `
  export interface ${functionNameInPascalCase}ResponseDataType {
${convertTypeToString(responseDataType, 2)}
  }
`;
  })
});

result += `}
`;


result += `
export namespace ResponseType {
  export interface NoDataResponseType {
    isSuccessful: boolean;
    errorCode?: string;
  }

  export interface BaseResponseType extends NoDataResponseType {
    data?: {};
  }
`;

Object.entries(doc).map(([serviceName, funcitonMap]) => {
  Object.entries(funcitonMap).forEach(([functionName, functionContent]) => {
    const functionNameInPascalCase = toPascalCase(functionName);
    const {
      errorCodes,
      requestBodyType,
      responseDataType,
    } = functionContent;
    // TODO : What if function has no errorCode?
    result += `
  export interface ${functionNameInPascalCase}ResponseType extends ${requestBodyType ? 'BaseResponseType': 'NoDataResponseType'} {
  ${
    errorCodes
    ? `  errorCode?: ErrorCode.${functionNameInPascalCase}ErrorCode | ErrorCode.DefaultErrorCode;`
    : '  errorCode?: ErrorCode.DefaultErrorCode;'
  }${
    responseDataType
    ? `
    data?: ResponseDataType.${functionNameInPascalCase}ResponseDataType;`
    : ''
  }
  }
`;
  })
});

result += `}
`;

const filePath = path.join(outDir, 'ResponseType.ts');
fs.writeFileSync(filePath, result);
