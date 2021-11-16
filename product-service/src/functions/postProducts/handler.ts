import "source-map-support/register";

import { Client } from "pg";

import type { ValidatedEventAPIGatewayProxyEvent } from "@libs/apiGateway";
import { formatJSONResponse, formatErrorResponse } from "@libs/apiGateway";
import { middyfy } from "@libs/lambda";

import schema from "./schema";
import { CONFIG } from "../../db/connect.config";
import { ProductDto } from "../../shared/product.model";

const postProducts: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (
  event
) => {
  console.log("Invoking postProducts", JSON.stringify(event));
  const product: ProductDto = event.body as any;

  if (!product) {
    return formatErrorResponse({
      errorMessage: "body is empty",
      statusCode: 400,
    });
  }

  let client: Client;

  try {
    client = new Client(CONFIG);

    console.log("connecting to db client");
    await client.connect();
    console.log("connected to db client");

    await client.query("BEGIN");

    const insertProductQueryResult = await client.query(
      `insert into products(title, description, price)
                    values ($1, $2, $3) returning id;`,
      [product.title, product.description, product.price]
    );

    console.log(
      "insert into products",
      insertProductQueryResult && JSON.stringify(insertProductQueryResult)
    );

    const insertedProductId = insertProductQueryResult.rows[0].id;

    const insertStockQueryResult = await client.query(
      `insert into stocks(product_id, count) values
      ($1, $2)`,
      [insertedProductId, product.count]
    );

    console.log(
      "insert into stocks",
      insertStockQueryResult && JSON.stringify(insertStockQueryResult)
    );

    await client.query("COMMIT");

    const productQuery = await client.query(
      `
    select p.id, p.title, p.description, p.price, s.count from products p
    inner join stocks s on p.id = s.product_id
    where p.id = $1;`,
      [insertedProductId]
    );

    return formatJSONResponse({
      data: productQuery.rows[0],
    });
  } catch (e) {
    await client.query("ROLLBACK");
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

export const main = middyfy(postProducts);
