import "source-map-support/register";

import type { ValidatedEventAPIGatewayProxyEvent } from "@libs/apiGateway";
import { formatJSONResponse, formatErrorResponse } from "@libs/apiGateway";
import { middyfy } from "@libs/lambda";

import schema from "./schema";
import { findProductById } from "../../db";

const getProductsById: ValidatedEventAPIGatewayProxyEvent<typeof schema> =
  async (event) => {
    const id = parseInt(event.pathParameters.productId);

    if (Number.isNaN(id)) {
      return formatErrorResponse({
        errorMessage: "productId should be integer",
        statusCode: 400,
      });
    }

    try {
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
    } catch (e) {
      const message = `Something went wrong when looking for product: ${id}`;
      console.log(message, e);

      return formatErrorResponse({
        errorMessage: message,
        statusCode: 400,
      });
    }
  };

export const main = middyfy(getProductsById);
