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

let result = `
import Router from 'koa-router';
import { ResponseType } from '../ResponseType';
import { ErrorCode } from '../ErrorCode';

export interface Session {
  userId: number;
}

export interface HgsRouterContext {
  session: Session;
  ip: string;
}

export async function passAuthorizationMiddleware(ctx, next) {
  return await next();
}

interface HandlersInfo {
  handler: Function;
  url: string;
  passAuth: boolean;
  bodyKeys: string[];
}

abstract class HgsRouter {
  protected readonly handlersInfos: HandlersInfo[];
  getKoaRouter(): Router {
    const router = new Router();
    this.handlersInfos.forEach(info => {
      const {
        handler,
        url,
        passAuth,
        bodyKeys,
      } = info;
      router.post(url, passAuth ? passAuthorizationMiddleware : (_, next) => next(), async (ctx, next) => {
        try {
          const bodyValues = bodyKeys.map(key => ctx.request.body[key]);

          const response = await handler.call(this, ctx, ...bodyValues);
          ctx.response.body = response;
        } catch(error) {
          // TODO
          ctx.response.body = {
            isSuccessful: false,
            errorCode: ErrorCode.DefaultErrorCode.InternalServerError,
          };
        }
      });
    });

    return router;
  }
}
`;

Object.entries(doc).map(([serviceName, functionMap]) => {
  result += `
export abstract class Base${toPascalCase(serviceName)}ApiRouter extends HgsRouter {
  protected readonly handlersInfos: HandlersInfo[] = [`
    result += Object.entries(functionMap).map(([functionName, functionContent]) => {
      const {
        passAuth,
        responseDataType,
        requestBodyType,
      } = functionContent;
      const url = `/${serviceName}/${functionName}`;
      return `
    {
      handler: this.${toCamelCase(functionName)},
      url: '${url}',
      passAuth: ${passAuth || false},
      bodyKeys: [${Object.keys(requestBodyType || {}).map(key => `'${key.replace(/\?/g, '')}'`).join(', ')}],
    },`;
    }).join('\n');
    result += `
  ];
`
  Object.entries(functionMap).forEach(([functionName, functionContent]) => {
    const functionNameInPascalCase = toPascalCase(functionName);
    const {
      requestBodyType,
    } = functionContent;
    // TODO : What if function has no errorCode?
    result += `
  protected abstract async ${toCamelCase(functionName)}(
    context: HgsRouterContext,
`;
    if (requestBodyType) {
      result += `${convertTypeToString(requestBodyType, 2).replace(/;/g, ',')}
`;
    }
    result += `  ): Promise<ResponseType.${functionNameInPascalCase}ResponseType>;
`;
  });
  result += '}\n'
});

async function save() {
  const generatedDir = path.join(outDir, 'server');
  await fs.mkdirp(generatedDir);
  const filePath = path.join(generatedDir, 'ServerBaseApiRouter.ts');
  await fs.writeFile(filePath, result);
}

save();
