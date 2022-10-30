import { S3Handler } from "aws-lambda";
import * as sdk from "aws-sdk";
import sharp from "sharp";
import { Readable } from "stream";
import { v4 } from "uuid";

const TABLE_NAME = process.env.TABLE_NAME!;
const dbClient = new sdk.DynamoDB.DocumentClient({
  region: "eu-central-1",
  apiVersion: "latest",
});

export const handler: S3Handler = async (event, ctx) => {
  try {
    const bucketName = event.Records?.[0]?.s3.bucket.name;
    const imageName = event.Records?.[0]?.s3.object.key;
    console.log("received : " + JSON.stringify({ imageName, bucketName }));
    const s3 = new sdk.S3({
      region: "eu-central-1",
    });
    const uuid = v4();

    if (imageName?.startsWith("thumbnail/")) {
      return;
    }
    const rs = await s3
      .getObject({
        Key: imageName,
        Bucket: bucketName,
      })
      .createReadStream();
    const outputBuffer = await resize(rs);
    await s3
      .putObject({
        Body: outputBuffer,
        Bucket: bucketName,
        Key: `thumbnail/${uuid}`,
      })
      .promise();
    await saveThumbnailInfo({
      uuid,
      imageName,
    });
    console.log(
      "thumbnail created: " +
        JSON.stringify({
          Bucket: bucketName,
          imageName,
          Key: `thumbnail/${uuid}`,
        })
    );
  } catch (e) {
    console.log("Error: " + JSON.stringify((e as Error)?.message));
  }
};

export const resize = async (rs: Readable) => {
  const inputBuffer = [];
  for await (const data of rs) {
    inputBuffer.push(data);
  }
  return sharp(Buffer.concat(inputBuffer)).resize(50, 50).png().toBuffer();
};

type ThumbnailInfo = {
  uuid: string;
  imageName: string;
};

export const saveThumbnailInfo = async (input: ThumbnailInfo) => {
  return dbClient
    .put({
      Item: input,
      TableName: TABLE_NAME,
    })
    .promise();
};
