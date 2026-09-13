import sharp from "sharp";
import { requireTeacher } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { HttpError } from "@/lib/errors";
import { api, readBytes, sameOrigin } from "@/lib/http";

export async function POST(request: Request) {
  return api(async () => {
    sameOrigin(request);
    await requireTeacher();
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(
        request.headers.get("content-type") ?? "",
      )
    )
      throw new HttpError(415, "JPG, PNG, WebP 사진을 선택해 주세요.");
    const input = await readBytes(request, 2 * 1024 * 1024);
    let data: Buffer;
    try {
      const source = sharp(input, { limitInputPixels: 25000000 });
      const metadata = await source.metadata();
      if (!["jpeg", "png", "webp"].includes(metadata.format ?? ""))
        throw new Error("Unsupported image");
      data = await source
        .rotate()
        .resize(1600, 1000, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer();
    } catch {
      throw new HttpError(
        400,
        "사진을 읽을 수 없습니다. 2MB 이하의 JPG, PNG, WebP 파일을 선택해 주세요.",
      );
    }
    const { rows } = await getDb().query<{ id: string }>(
      "INSERT INTO photos(data) VALUES($1) RETURNING id",
      [data],
    );
    return { id: rows[0].id };
  });
}
