import type { AWS } from "@serverless/typescript";

import basicAuthorizer from "@functions/basicAuthorizer";

import { GITHUB_ACCOUNT } from "../_config";

const serverlessConfiguration: AWS = {
  service: "auth-service",
  frameworkVersion: "2",
  custom: {
    webpack: {
      webpackConfig: "./webpack.config.js",
      includeModules: true,
    },
  },
  plugins: ["serverless-webpack", "serverless-dotenv-plugin"],
  provider: {
    name: "aws",
    runtime: "nodejs14.x",
    region: "eu-west-1",
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
    },
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1",

      GITHUB_ACCOUNT,
    },
    lambdaHashingVersion: "20201221",
  },
  functions: { basicAuthorizer },
  resources: {
    Outputs: {
      basicAuthorizerArn: {
        Value: {
          "Fn::GetAtt": ["BasicAuthorizerLambdaFunction", "Arn"],
        },
      },
    },
  },
};

module.exports = serverlessConfiguration;
