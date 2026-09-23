import { requireTeacher } from "@/lib/auth";
import { api, jsonInput, sameOrigin } from "@/lib/http";
import { reorderEvents } from "@/lib/repository";
import { reorderInput } from "@/lib/validation";
export async function PUT(request: Request) {
  return api(async () => {
    sameOrigin(request);
    await requireTeacher();
    await reorderEvents(await jsonInput(request, reorderInput));
    return { ok: true };
  });
}
