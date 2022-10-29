# Thumbnail-Generator triggered upon uploading a file to S3-Bucket on AWS

Just listens to an S3-Bucket and executes a Lambda which puts a thumbnail into the same bucket.
Using AWS Cdk.

Needed to use a Dockerfile for the Lambda Code because of the library "sharp" which resizes images.
This depends on native modules which doesnt get bundled properly otherwise on MacOS Apple Silicon to the Lambda-OS.