import { replicate } from "@/lib/server/replicate";
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
  const output = await replicate.run(
    "fenglinglwb/large-hole-image-inpainting:4b52aba43c7acdf89dd71429921a60f3696c2bb9c9242f10f1a6c212c0e596eb",
    {
      input: {
        image: `https://watermark-remover.s3.ap-southeast-1.amazonaws.com/image/${fileName}`,
        mask: `https://watermark-remover.s3.ap-southeast-1.amazonaws.com/mask/${fileName}`,
      },
    },
  );
  return Response.json(output, {
    status: 200,
  });
}
