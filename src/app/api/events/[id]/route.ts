import { z } from "zod";
import { requireTeacher } from "@/lib/auth";
import { api, jsonInput, sameOrigin } from "@/lib/http";
import { editEvent } from "@/lib/repository";
import { editInput } from "@/lib/validation";
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return api(async () => {
    sameOrigin(request);
    await requireTeacher();
    const { id } = await context.params;
    return editEvent(z.uuid().parse(id), await jsonInput(request, editInput));
  });
}
