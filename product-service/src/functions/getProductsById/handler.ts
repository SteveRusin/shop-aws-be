import "source-map-support/register";

import type { ValidatedEventAPIGatewayProxyEvent } from "@libs/apiGateway";
import { formatJSONResponse, formatErrorResponse } from "@libs/apiGateway";
import { middyfy } from "@libs/lambda";

import schema from "./schema";
import { findProductById } from "../../db";

const getProductsById: ValidatedEventAPIGatewayProxyEvent<typeof schema> =
  async (event) => {
    const id = parseInt(event.queryStringParameters.productId);

    if (Number.isNaN(id)) {
      return formatErrorResponse({
        errorMessage: "productId should be integer",
        statusCode: 400,
      });
    }

    const product = await findProductById(id);

    if (!product) {
      return formatErrorResponse({
        errorMessage: `product with id: ${id} not exist`,
        statusCode: 404,
      });
    }

    return formatJSONResponse({
      data: product,
    });
  };

export const main = middyfy(getProductsById);
