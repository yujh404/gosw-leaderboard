import { z } from "zod";
import { HttpError } from "./errors";

export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (
    !origin ||
    (origin !== new URL(request.url).origin &&
      origin !== process.env.NEXT_PUBLIC_APP_URL)
  ) {
    throw new HttpError(403, "허용되지 않은 요청입니다.");
  }
}

export async function readBytes(request: Request, maxBytes: number) {
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, "요청 내용이 없습니다.");
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > maxBytes) {
        await reader.cancel();
        throw new HttpError(413, "파일 또는 입력 내용이 너무 큽니다.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks);
}

export async function jsonInput<T>(request: Request, schema: z.ZodType<T>) {
  if (!request.headers.get("content-type")?.includes("application/json"))
    throw new HttpError(415, "JSON 형식으로 요청해 주세요.");
  const buffer = await readBytes(request, 32768);
  let input: unknown;
  try {
    input = JSON.parse(buffer.toString("utf8"));
  } catch {
    throw new HttpError(400, "요청 형식이 올바르지 않습니다.");
  }
  return schema.parse(input);
}

export async function api<T>(fn: () => Promise<T>) {
  try {
    return Response.json(await fn(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (error instanceof z.ZodError)
      return Response.json(
        {
          error:
            "입력값을 확인해 주세요. 점수는 0~100,000 사이의 정수여야 합니다.",
        },
        { status: 400 },
      );
    if (error instanceof HttpError)
      return Response.json({ error: error.message }, { status: error.status });
    console.error("Leaderboard request failed", {
      type: error instanceof Error ? error.name : "UnknownError",
    });
    return Response.json(
      { error: "서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요." },
      { status: 503 },
    );
  }
}
