export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(
    { version: process.env.NEXT_PUBLIC_BUILD_ID },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "Access-Control-Allow-Origin": "*",
      },
    },
  );
}
