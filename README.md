# Thumbnail-Generator triggered upon uploading a file to S3-Bucket on AWS

- Listens for an S3-Bucket-Object-Created-Event
- Executes a Lambda which puts a thumbnail with a uuid into the bucket's "thumbnail"-folder" & saves thumbnail-uuid-mapping in a Dynambo-DB
- Provides a Rest-Api for the thumbnail image, which uses the Dynamodb to look thumbnail-uuid-mapping and returns thumbnail-image from the S3-Bucket 

Solved Problems:
- Needed to use a Dockerfile for the Lambda Code because of the library "sharp" which resizes images.
This depends on native modules which doesnt get bundled properly otherwise on MacOS Apple Silicon to the Lambda-OS.
- Thumbnail needs to get provided via Url but unfortunately not all filenames are allowed as Bucket-keys. So introduced a uuid-imageName-mapping & saving this mapping in Dynamodb.
- Lambda returns the binary image and not the S3-Bucket itself by using "binaryMediaTypes"-property for the Rest-API, which converts base64-string returned the lambda to a binary stream