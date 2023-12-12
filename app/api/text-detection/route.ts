import { Rekognition } from "aws-sdk";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const fileName = request.nextUrl.searchParams.get("filename");
  if (!fileName) {
    return Response.json(
      { error: "fileName is required" },
      {
        status: 400,
      },
    );
  }
  const bucketName = process.env.AWS_BUCKET_NAME as string;
  const rekognitionClient = new Rekognition();

  const data = await rekognitionClient
    .detectText({
      Image: {
        S3Object: {
          Bucket: bucketName,
          Name: `image/${fileName}`,
        },
      },
    })
    .promise();

  const filteredData: Rekognition.DetectTextResponse = {
    ...data,
    TextDetections: data.TextDetections?.filter((text) => text.Type === "WORD"),
  };

  return Response.json(filteredData, {
    status: 200,
  });
}
