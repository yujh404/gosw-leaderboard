import { logout } from "@/lib/auth";
import { api, sameOrigin } from "@/lib/http";
export async function POST(request: Request) {
  return api(async () => {
    sameOrigin(request);
    await logout();
    return { ok: true };
  });
}
