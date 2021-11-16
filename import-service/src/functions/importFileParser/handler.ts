import "source-map-support/register";

import { S3, SQS } from "aws-sdk";
import { S3Event, S3Handler } from "aws-lambda";
import * as csv from "csv-parser";

const importFileParser: S3Handler = (event: S3Event) => {
  console.log("s3 event", event);
  const s3 = new S3({ region: "eu-west-1", signatureVersion: "v4" });
  const sqs = new SQS();
  const recordsPromises = [];

  for (const record of event.Records) {
    const parsePromise = new Promise((resolve, reject) => {
      const stream = s3
        .getObject({
          Bucket: "node-aws-uploaded",
          Key: record.s3.object.key,
        })
        .createReadStream()
        .pipe(csv());

      stream
        .on("data", (chunk) => {
          console.log("csv chunk", chunk);
          sqs.sendMessage(
            {
              QueueUrl: process.env.SQS_URL,
              MessageBody: JSON.stringify(chunk),
            },
            (err) => {
              if (err) {
                console.error("Error sending chunk to sqs", err);
                stream.emit("error", err);
                return;
              }
              console.log("Chunk has been send to sqs", chunk);
            }
          );
        })
        .on("error", (error) => {
          console.error("csv error", error);
          reject(error);
        })
        .on("end", async () => {
          try {
            await s3
              .copyObject({
                Bucket: "node-aws-uploaded",
                CopySource: `node-aws-uploaded/${record.s3.object.key}`,
                Key: record.s3.object.key.replace("uploaded", "parsed"),
              })
              .promise();

            await s3
              .deleteObject({
                Bucket: "node-aws-uploaded",
                Key: record.s3.object.key,
              })
              .promise();

            resolve(null);
          } catch (e) {
            reject(e);
          }
        });
    });

    recordsPromises.push(parsePromise);
  }

  return Promise.allSettled(recordsPromises).then(() => null);
};

export const main = importFileParser;
