import "source-map-support/register";

import { Client } from "pg";

import type { ValidatedEventAPIGatewayProxyEvent } from "@libs/apiGateway";
import { formatJSONResponse, formatErrorResponse } from "@libs/apiGateway";
import { middyfy } from "@libs/lambda";

import schema from "./schema";
import { CONFIG } from "../../db/connect.config";

const getProductsList: ValidatedEventAPIGatewayProxyEvent<typeof schema> =
  async () => {
    let client: Client;

    try {
      client = new Client(CONFIG);

      console.log("connecting to db client");
      await client.connect();
      console.log("connected to db client");

      const queryResult = await client.query(`
        select p.id, p.title, p.description, p.price, s.count from products p
        inner join stocks s on p.id = s.product_id
      `);

      console.log("query result", queryResult && JSON.stringify(queryResult));

      return formatJSONResponse({
        data: queryResult.rows,
      });
    } catch (e) {
      const message = `Something went wrong`;
      console.log(message, e);

      return formatErrorResponse({
        errorMessage: message,
        statusCode: 400,
      });
    } finally {
      client.end();
    }
  };

export const main = middyfy(getProductsList);
