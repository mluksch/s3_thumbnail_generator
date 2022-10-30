import * as cdk from "aws-cdk-lib";
import { Duration } from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  Architecture,
  Code,
  DockerImageCode,
  Runtime,
} from "aws-cdk-lib/aws-lambda";
import * as path from "path";
import { Platform } from "aws-cdk-lib/aws-ecr-assets";
import { AttributeType } from "aws-cdk-lib/aws-dynamodb";
import Esbuild from "esbuild";

export class Cdk6Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const s3 = new cdk.aws_s3.Bucket(this, "thumbnails", {
      bucketName: "123-test-thumbnails",
    });

    const thumbnailDb = new cdk.aws_dynamodb.Table(this, "testthumbnails", {
      tableName: "testthumbnails",
      partitionKey: {
        type: AttributeType.STRING,
        name: "imageName",
      },
    });

    const resizerHandler = new cdk.aws_lambda.DockerImageFunction(
      this,
      "resizer",
      {
        functionName: "resizer",
        code: DockerImageCode.fromImageAsset(path.join(__dirname, ".."), {
          platform: Platform.LINUX_AMD64,
        }),
        architecture: Architecture.X86_64,
        environment: {
          TABLE_NAME: thumbnailDb.tableName,
        },
        timeout: Duration.seconds(10),
      }
    );
    const target = new cdk.aws_s3_notifications.LambdaDestination(
      resizerHandler
    );
    s3.grantReadWrite(resizerHandler);
    s3.addObjectCreatedNotification(target);
    thumbnailDb.grantReadWriteData(resizerHandler);

    Esbuild.buildSync({
      target: "node16",
      platform: "node",
      outdir: path.join(__dirname, "..", "dist"),
      entryPoints: [path.join(__dirname, "..", "src", "provideThumbnail.ts")],
      bundle: true,
      sourcemap: true,
    });
    const thumbnailProvider = new cdk.aws_lambda.Function(
      this,
      "thumbnailProvider",
      {
        functionName: "provideThumbnail",
        code: Code.fromAsset(path.join(__dirname, "../dist")),
        runtime: Runtime.NODEJS_16_X,
        architecture: Architecture.ARM_64,
        handler: "provideThumbnail.handler",
        environment: {
          TABLE_NAME: thumbnailDb.tableName,
          BUCKET_NAME: s3.bucketName,
        },
        timeout: Duration.seconds(10),
      }
    );
    s3.grantRead(thumbnailProvider);
    thumbnailDb.grantReadData(thumbnailProvider);
    const restApi = new cdk.aws_apigateway.RestApi(
      this,
      "thumbnail-generator",
      {
        restApiName: "thumbnail-generator",
        deployOptions: {
          stageName: "test",
        },
        // in combo with proxy === true
        // transforms all Accept-Content-Type in the request into binary response
        // Important here to map all Content-Types to binary response
        binaryMediaTypes: ["*/*"],
      }
    );
    const get = restApi.root.addResource("{imageName}");
    get.addMethod(
      "get",
      new cdk.aws_apigateway.LambdaIntegration(thumbnailProvider, {
        // proxy === true means:
        // lambda function has a special input & output format with statusCode, headers, body
        proxy: true,
      })
    );

    // The code that defines your stack goes here

    // example resource
    // const queue = new sqs.Queue(this, 'Cdk6Queue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });
  }
}
