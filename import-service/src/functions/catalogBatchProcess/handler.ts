import "source-map-support/register";

import { Client } from "pg";
import { SQSHandler } from "aws-lambda";
import { SNS } from "aws-sdk";

import { CONFIG } from "../../../db.connect";

const catalogBatchProcess: SQSHandler = async (event) => {
  console.log("sqs queue event", event);
  let client: Client;
  const sns = new SNS({
    region: "eu-west-1",
  });

  for (const record of event.Records) {
    const product = JSON.parse(record.body);

    try {
      client = client || new Client(CONFIG);

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
    } catch (e) {
      await client.query("ROLLBACK");
      const message = `Something went wrong`;
      console.log(message, e);
    } finally {
      client.end();
    }
  }

  try {
    sns
      .publish({
        Subject: "Added products",
        TopicArn: process.env.SNS_ARN,
        Message: `Products has been added ${event.Records.map(
          (e) => `${e.body} \n`
        )}`,
      })
      .promise();

    console.log("Email has been send");
  } catch (e) {
    console.error("Error sending email", e);
  }
};

export const main = catalogBatchProcess;
