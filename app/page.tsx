"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toBase64 } from "@/lib/file";
import type { DetectTextResponse } from "aws-sdk/clients/rekognition";
import axios from "axios";
import Jimp from "jimp/es";
import { Loader2 } from "lucide-react";
import { nanoid } from "nanoid";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function Home() {
  const [image, setImage] = useState<string>();
  const [maskImage, setMaskImage] = useState<string>();
  const [detection, setDetection] = useState<DetectTextResponse>();
  const [loading, setLoading] = useState<boolean>(false);
  const [resultImage, setResultImage] = useState<string>();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [excludeMask, setExcludeMask] = useState<number[]>([]);
  const router = useRouter();
  const uploadImage = async (
    id: string,
    image: string,
    prefix: "image" | "mask",
  ) => {
    await axios.post<{
      imgUrl: string;
    }>("/api/image", {
      fileName: id,
      image: image,
      prefix,
    });
    router.push(`?id=${id}`);
  };

  const removeWatermark = async () => {
    if (!id || !maskImage) return;
    setLoading(true);
    await uploadImage(id, maskImage, "mask");
    const { data } = await axios.get<string>(`/api/inpaint?filename=${id}`);
    setResultImage(data);
    setLoading(false);
  };

  const clearMetadatas = () => {
    setImage(undefined);
    setMaskImage(undefined);
    setResultImage(undefined);
    setDetection(undefined);
    setExcludeMask([]);
  };

  useEffect(() => {
    if (!id) return;
    setImage(
      `https://watermark-remover.s3.ap-southeast-1.amazonaws.com/image/${id}`,
    );
    (async () => {
      const res = await axios.get<DetectTextResponse>(
        `/api/text-detection?filename=${id}`,
      );
      setDetection(res.data);
    })();
  }, [id]);

  useEffect(() => {
    if (!detection) return;
    const getMaskImage = async () => {
      const mask = new Jimp(512, 512, 0xffffffff);
      detection.TextDetections?.filter(
        (td) => !excludeMask.includes(td.Id ?? -1),
      ).forEach((textDetection) => {
        const x = Math.round(
          (textDetection.Geometry?.BoundingBox?.Left ?? 0) * 512,
        );
        const y = Math.round(
          (textDetection.Geometry?.BoundingBox?.Top ?? 0) * 512,
        );
        const width = Math.round(
          (textDetection.Geometry?.BoundingBox?.Width ?? 0) * 512,
        );
        const height = Math.round(
          (textDetection.Geometry?.BoundingBox?.Height ?? 0) * 512,
        );
        mask.scan(x, y, width, height, function (x, y, idx) {
          this.bitmap.data[idx + 0] = 0;
          this.bitmap.data[idx + 1] = 0;
          this.bitmap.data[idx + 2] = 0;
          this.bitmap.data[idx + 3] = 255;
        });
      });
      const maskBase64 = await mask.getBase64Async(Jimp.MIME_PNG);
      setMaskImage(maskBase64);
    };
    getMaskImage();
  }, [detection, id, excludeMask]);

  return (
    <main className="space-y-6 p-4">
      <div className="flex gap-2">
        <Input
          type="file"
          accept="image/*"
          onChange={async (e) => {
            if (e.target.files === null) return;
            if (e.target.files.length === 0) return;

            clearMetadatas();

            const file = e.target.files[0];
            const data = await toBase64(file);
            const image = await Jimp.read(data);
            const width = image.getWidth();
            const height = image.getHeight();
            const newid = nanoid();
            if (width !== 512 || height !== 512) {
              alert("Please upload 512x512 image");
              return;
            }
            await uploadImage(newid, data, "image");
          }}
        />
        <Button
          onClick={removeWatermark}
          disabled={!detection}
          className="w-40"
        >
          {loading ? <Loader2 className="animate-spin" /> : "Remove Watermark"}
        </Button>
      </div>
      <div className="flex justify-center gap-10">
        {image && (
          <div className="space-y-2 border border-border p-4">
            <h2 className="text-center text-lg">Original Image</h2>
            <div className="relative h-max w-max">
              <Image
                className="relative z-0 drop-shadow-md"
                alt="unmasked-image"
                src={image}
                width={512}
                height={512}
              />

              {detection?.TextDetections?.map((textDetection) => (
                <div
                  key={textDetection.Id}
                  onClick={() => {
                    if (excludeMask.includes(textDetection.Id ?? -1)) {
                      setExcludeMask((prev) =>
                        prev.filter((id) => id !== textDetection.Id),
                      );
                    } else {
                      setExcludeMask((prev) => [
                        ...prev,
                        textDetection.Id ?? -1,
                      ]);
                    }
                  }}
                  style={{
                    position: "absolute",
                    width: Math.round(
                      (textDetection.Geometry?.BoundingBox?.Width ?? 0) * 512,
                    ),
                    height: Math.round(
                      (textDetection.Geometry?.BoundingBox?.Height ?? 0) * 512,
                    ),
                    top: Math.round(
                      (textDetection.Geometry?.BoundingBox?.Top ?? 0) * 512,
                    ),
                    left: Math.round(
                      (textDetection.Geometry?.BoundingBox?.Left ?? 0) * 512,
                    ),
                    zIndex: 10,
                    backgroundColor: excludeMask.includes(
                      textDetection.Id ?? -1,
                    )
                      ? "transparent"
                      : "red",
                    border: "4px solid red",
                    opacity: 0.2,
                    cursor: "pointer",
                  }}
                />
              ))}
            </div>
          </div>
        )}
        {maskImage && (
          <div className="space-y-2 border border-border p-4">
            <h2 className="text-center text-lg">Mask Image</h2>
            <Image
              alt="mask-image"
              src={maskImage}
              width={512}
              height={512}
              className="drop-shadow-md"
            />
          </div>
        )}
      </div>
      {resultImage && (
        <div className="flex justify-center">
          <div className="w-max space-y-2 border border-border p-4">
            <h2 className="text-center text-lg">Result Image</h2>
            <Image
              alt="mask-image"
              src={resultImage}
              width={512}
              height={512}
              className="drop-shadow-md"
            />
          </div>
        </div>
      )}
    </main>
  );
}
