import { requireTeacher } from "@/lib/auth";
import { api, jsonInput, sameOrigin } from "@/lib/http";
import { createEvent } from "@/lib/repository";
import { eventInput } from "@/lib/validation";
export async function POST(request: Request) {
  return api(async () => {
    sameOrigin(request);
    await requireTeacher();
    return createEvent(await jsonInput(request, eventInput));
  });
}
