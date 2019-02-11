const fs = require('fs-extra');
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


let result = `import { RequestBodyType } from '../RequestBodyType';
import { ResponseType, ResponseDataType } from '../ResponseType';

let sessionToken: string;
let baseServerUrl: string;
let isDevelopment: boolean;

class HgsRestApiResponse<T extends ResponseType.BaseResponseType, R> {
  constructor(readonly rawResponse: T) {
  }
  get isSuccessful() {
    return this.rawResponse.isSuccessful;
  }
  get data(): R {
    if (!this.rawResponse.isSuccessful) {
      throw new Error('it must be successful to get data');
    }
    if (!this.rawResponse.data) {
      throw new Error('data is empty, not possible error');
    }
    return this.rawResponse.data as R;
  }
  get errorCode() {
    return this.rawResponse.errorCode;
  }
}

export namespace HgsRestApi {
    export function setSessionToken(newSessionToken: string) {
       sessionToken = newSessionToken;
    }
    export function setBaseServerUrl(newBaseServerUrl: string) {
        baseServerUrl = newBaseServerUrl;
    }
    export function is2xx(response: Response): boolean {
      return response.status >= 200 && response.status < 300;
    }
    export function setIsDevelopment(yesOrNo: boolean) {
      isDevelopment = yesOrNo;
    }

`;


Object.entries(doc).map(([serviceName, functionMap]) => {
  Object.entries(functionMap).forEach(([functionName, functionContent]) => {
    const functionNameInPascalCase = toPascalCase(functionName);
    const {
      errorCodes,
      requestBodyType,
      responseDataType,
      baseServerUrl,
    } = functionContent;
    const urlPath = `/${serviceName}/${functionName}`;

    const hasResponseData = !!responseDataType;

    result += `
  export async function ${toCamelCase(functionName)}(`;

    if (requestBodyType) {
      result += `
    body: RequestBodyType.${functionNameInPascalCase}RequestBodyType,
  `;
    }

    result += hasResponseData
    ? `): Promise<HgsRestApiResponse<ResponseType.${functionNameInPascalCase}ResponseType, ResponseDataType.${functionNameInPascalCase}ResponseDataType>> {`
    : `): Promise<ResponseType.${functionNameInPascalCase}ResponseType> {`;

    if (baseServerUrl) {
      result += `
    const url = isDevelopment
      ? '${baseServerUrl}${urlPath}'
      : \`\${baseServerUrl}${urlPath}\`;
      `;
    } else {
      result += `
    const url = \`\${baseServerUrl}${urlPath}\`;`;
    }

    result += `
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(sessionToken
          ? { Authorization: \`sessionToken \${sessionToken}\` }
          : {}
        ),
      },`;
    if (requestBodyType) {
      result += `
      body: JSON.stringify(body),`;
    }
    result += `
    });

    if (!is2xx(response)) {
      throw new Error(response.status.toString());
    }
    ${hasResponseData ? `return new HgsRestApiResponse(await response.json());` : `return await response.json();`}
  }`;
  });
  result += '\n'
});

result += `}
`;

async function save() {
  const generatedDir = path.join(outDir, 'client');
  await fs.mkdirp(generatedDir);
  const filePath = path.join(generatedDir, 'ClientApis.ts');
  await fs.writeFile(filePath, result);
}

save();
