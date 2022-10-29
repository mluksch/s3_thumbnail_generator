import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { Architecture, DockerImageCode } from "aws-cdk-lib/aws-lambda";
import * as path from "path";
import { Platform } from "aws-cdk-lib/aws-ecr-assets";

export class Cdk6Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const s3 = new cdk.aws_s3.Bucket(this, "thumbnails", {
      bucketName: "123-test-thumbnails",
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
      }
    );
    const target = new cdk.aws_s3_notifications.LambdaDestination(
      resizerHandler
    );
    s3.grantReadWrite(resizerHandler);
    s3.addObjectCreatedNotification(target);

    // The code that defines your stack goes here

    // example resource
    // const queue = new sqs.Queue(this, 'Cdk6Queue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });
  }
}
