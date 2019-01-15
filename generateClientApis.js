const fs = require('fs-extra');
const yaml = require('js-yaml');
const toCamelCase = require('./utils/toCamelCase');
const toPascalCase = require('./utils/toPascalCase');

const definitionFile = fs.readFileSync('./apiDefinitions.yml', {
  encoding: 'utf-8',
});

const doc = yaml.safeLoad(definitionFile);


let result = `import { RequestBodyType } from '../RequestBodyType';
import { ParamMap } from '../ParamMap';
import { ResponseType, ResponseDataType } from '../ResponseType';

let sessionToken: string;
let baseServerUrl: string;

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

`;


Object.entries(doc).map(([serviceName, functionMap]) => {
  Object.entries(functionMap).forEach(([functionName, functionContent]) => {
    const functionNameInPascalCase = toPascalCase(functionName);
    const {
      errorCodes,
      url,
      method,
      requestBodyType,
      responseDataType,
    } = functionContent;

    // <BEFORE>
    // const url = `${baseServerURL}/post/:postId/like`;

    // <AFTER>
    // const url = `${baseServerURL}/post/${params.postId}/like`;

    const replacedUrl = url.split('/').map(urlPart => {
      if (!urlPart.startsWith(':')) {
        return urlPart;
      }
      return `\${params.${urlPart.substring(1)}}`;
    }).join('/');

    result += `
    export async function ${toCamelCase(functionName)}(
        params: ParamMap.${functionNameInPascalCase}ParamMap,
        body: RequestBodyType.${functionNameInPascalCase}RequestBodyType,
    ): Promise<HgsRestApiResponse<ResponseType.${functionNameInPascalCase}ResponseType, ResponseDataType.${functionNameInPascalCase}ResponseDataType>> {
        const url = \`\${baseServerUrl}${replacedUrl}\`;
        const response = await fetch(url, {
            method: '${method}',
            headers: {
                'content-type': 'application/json',
                ...(sessionToken
                  ? { Authorization: \`sessionToken \${sessionToken}\` }
                  : {}
                )
            },
            body: JSON.stringify(body),
        });

        if (!is2xx(response)) {
            throw new Error(response.status.toString());
        }
        return new HgsRestApiResponse(await response.json());
    }`;
  });
  result += '\n'
});

result += `}
`;

async function save() {
  await fs.mkdirp('./generated/client');
  await fs.writeFile('./generated/client/ClientApis.ts', result);
}

save();
