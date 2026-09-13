export class RequestError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
export async function requestJson<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    cache: "no-store",
    signal: options.signal ?? AbortSignal.timeout(15000),
  });
  const data = await response.json();
  if (!response.ok)
    throw new RequestError(
      data.error ?? "요청을 처리하지 못했습니다.",
      response.status,
    );
  return data;
}
export const jsonBody = (body: unknown) => ({
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});
