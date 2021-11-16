import "source-map-support/register";

import { S3 } from "aws-sdk";

import type { ValidatedEventAPIGatewayProxyEvent } from "@libs/apiGateway";
import { formatJSONResponse } from "@libs/apiGateway";
import { middyfy } from "@libs/lambda";

import schema from "./schema";

const importProductsFile: ValidatedEventAPIGatewayProxyEvent<typeof schema> =
  async (event) => {
    console.log("lambda event", event);

    const fileName = event.queryStringParameters.name;

    const s3 = new S3({ region: "eu-west-1", signatureVersion: 'v4' });

    const signedUrl = await s3.getSignedUrlPromise("putObject", {
      Bucket: "node-aws-uploaded",
      Key: `uploaded/${fileName}`,
      ACL: 'public-read',
      ContentType: 'text/csv',
      Expires: 60,
    });

    return formatJSONResponse({
      data: signedUrl
    });
  };

export const main = middyfy(importProductsFile);
