import { handlerPath } from "@libs/handlerResolver";

import { AWS } from "@serverless/typescript";

const config: AWS["functions"] = {
  lambda: {
    handler: `${handlerPath(__dirname)}/handler.main`,
    events: [
      {
        http: {
          method: "get",
          path: "import",
          cors: true,
          authorizer: {
            name: "basicAuthorizer",
            //arn: "arn:aws:lambda:eu-west-1:084265091692:function:auth-service-dev-basicAuthorizer",
            resultTtlInSeconds: 0,
            arn: '${cf:auth-service-dev.basicAuthorizerArn}',
            identitySource: "method.request.header.Authorization",
            type: "token",
          },
        },
      },
    ],
  },
};

export default config.lambda;
