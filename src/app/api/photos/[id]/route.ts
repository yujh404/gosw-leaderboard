import { z } from "zod";
import { getDb } from "@/lib/db";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const result = z.uuid().safeParse((await context.params).id);
  if (!result.success) return new Response(null, { status: 404 });
  try {
    const { rows } = await getDb().query<{ data: Buffer }>(
      "SELECT data FROM photos WHERE id=$1",
      [result.data],
    );
    if (!rows.length) return new Response(null, { status: 404 });
    return new Response(new Uint8Array(rows[0].data), {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response(null, { status: 503 });
  }
}
