import "source-map-support/register";

import type { ValidatedEventAPIGatewayProxyEvent } from "@libs/apiGateway";
import { formatJSONResponse } from "@libs/apiGateway";
import { middyfy } from "@libs/lambda";

import schema from "./schema";
import { findProducts } from "../../db";

const getProductsList: ValidatedEventAPIGatewayProxyEvent<typeof schema> =
  async () => {
    return formatJSONResponse({
      data: await findProducts(),
    });
  };

export const main = middyfy(getProductsList);
