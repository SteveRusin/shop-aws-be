import "source-map-support/register";

import { middyfy } from "@libs/lambda";
import { APIGatewayTokenAuthorizerHandler } from "aws-lambda";

const basicAuthorizer: APIGatewayTokenAuthorizerHandler = async (event) => {
  console.log("basicAuthorizer", JSON.stringify(event));

  if (event.type !== "TOKEN") {

    throw "Unauthorized";
  }

  try {
    const token = event.authorizationToken;

    const creds = token.split(" ")[1];
    const buff = Buffer.from(creds, "base64");
    const plainCreds = buff.toString("utf-8").split(":");
    const userName = plainCreds[0];
    const password = plainCreds[1];

    console.log(
      JSON.stringify({
        userName,
        password,
      })
    );

    const userPassword = process.env[userName];
    const effect = userPassword && userPassword === password ? "Allow" : "Deny";

    console.log('effect', effect);
    console.log('userPassword', userPassword);

    return {
      principalId: creds,
      policyDocument: {
        Version: "2012-10-17",
        Statement: [
          {
            Action: "execute-api:Invoke",
            Effect: effect,
            Resource: event.methodArn,
          },
        ],
      },
    };
  } catch (e) {
    console.error("Error", e);

    throw `Unauthorized ${e.message}`;
  }

  throw "Somethig went wrong";
};

export const main = middyfy(basicAuthorizer);
