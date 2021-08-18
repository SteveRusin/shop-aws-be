import "source-map-support/register";

import { Client, ClientConfig } from "pg";

import type { ValidatedEventAPIGatewayProxyEvent } from "@libs/apiGateway";
import { formatJSONResponse, formatErrorResponse } from "@libs/apiGateway";
import { middyfy } from "@libs/lambda";

import schema from "./schema";

const { PG_HOST, PG_PORT, PG_DATABASE, PG_USERNAME, PG_PASSWORD } = process.env;

const config: ClientConfig = {
  host: PG_HOST,
  database: PG_DATABASE,
  password: PG_PASSWORD,
  user: PG_USERNAME,
  port: +PG_PORT,
  connectionTimeoutMillis: 20_000,
  ssl: {
    rejectUnauthorized: false,
  }
};

const getProductsById: ValidatedEventAPIGatewayProxyEvent<typeof schema> =
  async (event) => {
    const id = event.pathParameters.productId;

    if (id == null) {
      return formatErrorResponse({
        errorMessage: "productId should be defined",
        statusCode: 400,
      });
    }

    let client: Client;

    try {
      client = new Client(config);

      console.log("connecting to db client");
      await client.connect();
      console.log("connected to db client");

      console.log(`searching for product with id: ${id}`);

      const queryResult = await client.query(`
        select p.id, p.title, p.description, p.price, s.count from products p
        inner join stocks s on p.id = s.product_id
        where p.id = $1;
      `, [id]);

      const product = queryResult?.rows[0];

      console.log(`query result ${queryResult && JSON.stringify(queryResult)}`)

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
    } finally {
      client.end();
    }
  };

export const main = middyfy(getProductsById);
