import { login } from "@/lib/auth";
import { api, jsonInput, sameOrigin } from "@/lib/http";
import { loginInput } from "@/lib/validation";

export async function POST(request: Request) {
  return api(async () => {
    sameOrigin(request);
    const input = await jsonInput(request, loginInput);
    await login(input.username, input.password, request);
    return { ok: true };
  });
}
