import { APIGatewayProxyHandler } from "aws-lambda";
import sdk from "aws-sdk";

const TABLE_NAME = process.env.TABLE_NAME!;
const BUCKET_NAME = process.env.BUCKET_NAME!;

const dbClient = new sdk.DynamoDB.DocumentClient({
  region: "eu-central-1",
  apiVersion: "latest",
});

const s3 = new sdk.S3();

export const handler: APIGatewayProxyHandler = async (event, ctx) => {
  try {
    const imageName = event.pathParameters?.["imageName"];
    console.log("handler: ", event.pathParameters);
    if (!imageName) {
      return { statusCode: 400, body: "No thumbnail found" };
    }
    const info = await getThumbnailInfo(imageName);
    if (!info) {
      return { statusCode: 400, body: "No thumbnail found" };
    }
    const rs = s3
      .getObject({
        Key: `thumbnail/${info.uuid}`,
        Bucket: BUCKET_NAME,
      })
      .createReadStream();
    const buffer = [];
    for await (const data of rs) {
      buffer.push(data);
    }
    const data = Buffer.concat(buffer).toString("base64");
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "image/png",
      },
      body: data,
      isBase64Encoded: true, // this is important!
      // if not set to true, only a base64-string will get returned
      // w/o getting mapped to binary (see: binaryMediaTypes in RestApi)
      // if set to true, the ApiGateway will transform response & especially
      // this base64-string in body to binary stream
    };
  } catch (e) {
    console.log("Error: " + JSON.stringify((e as Error)?.message));
    return {
      statusCode: 500,
      body: JSON.stringify((e as Error)?.message ?? ""),
    };
  }
};

type ThumbnailInfo = {
  imageName: string;
  uuid: string;
};

const getThumbnailInfo = async (
  imageName: string
): Promise<{
  imageName: string;
  uuid: string;
} | null> => {
  const result = await dbClient
    .get({
      Key: {
        imageName,
      },
      TableName: TABLE_NAME,
    })
    .promise();
  return (result?.Item as ThumbnailInfo) ?? null;
};
