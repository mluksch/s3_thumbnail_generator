import { S3Handler } from "aws-lambda";
import * as sdk from "aws-sdk";
import sharp from "sharp";
import { Readable } from "stream";

export const handler: S3Handler = async (event, ctx) => {
  const bucketName = event.Records?.[0]?.s3.bucket.name;
  const fileName = event.Records?.[0]?.s3.object.key;
  console.log("file created : " + JSON.stringify({ fileName, bucketName }));
  const s3 = new sdk.S3({
    region: "eu-central-1",
  });

  if (fileName?.startsWith("thumbnail/")) {
    return;
  }
  const rs = await s3
    .getObject({
      Key: fileName,
      Bucket: bucketName,
    })
    .createReadStream();
  const outputBuffer = await resize(rs);
  await s3
    .putObject({
      Body: outputBuffer,
      Bucket: bucketName,
      Key: `thumbnail/${fileName}`,
    })
    .promise();
  console.log(
    "thumbnail created: " +
      JSON.stringify({
        Bucket: bucketName,
        Key: `thumbnail/${fileName}`,
      })
  );
};

export const resize = async (rs: Readable) => {
  const inputBuffer = [];
  for await (const data of rs) {
    inputBuffer.push(data);
  }
  return sharp(Buffer.concat(inputBuffer)).resize(50, 50).png().toBuffer();
};
