import { extractBase64AndType } from "@/lib/file";
import { S3 } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { fileName, image, prefix } = (await request.json()) as {
      fileName: string;
      image: string;
      prefix: string;
    };
    const s3client = new S3();

    const baseBucketName = process.env.AWS_BUCKET_NAME as string;

    const { base64Data: imgBuf, type: imgType } = extractBase64AndType(image);

    const imgRes = await new Upload({
      client: s3client,
      params: {
        Bucket: baseBucketName,
        Key: `${prefix}/${fileName}`,
        ContentType: `image/${imgType}`,
        Body: imgBuf,
      },
    }).done();
    return Response.json(
      {
        image: imgRes.Location,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.log(error);
    return Response.json(
      { error: (error as Error).message },
      {
        status: 500,
      },
    );
  }
}
