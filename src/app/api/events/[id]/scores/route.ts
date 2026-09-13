import { z } from "zod";
import { requireTeacher } from "@/lib/auth";
import { api, jsonInput, sameOrigin } from "@/lib/http";
import { saveScores } from "@/lib/repository";
import { scoreInput } from "@/lib/validation";
export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return api(async () => {
    sameOrigin(request);
    await requireTeacher();
    const { id } = await context.params;
    return saveScores(z.uuid().parse(id), await jsonInput(request, scoreInput));
  });
}
