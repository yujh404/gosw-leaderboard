import { z } from "zod";

export const eventInput = z.object({
  name: z.string().trim().min(1, "종목 이름을 입력해 주세요.").max(60),
  description: z.string().trim().max(2000),
  rules: z.string().trim().max(4000),
  status: z.enum(["waiting", "live", "completed"]),
  photoId: z.uuid().nullable(),
});
const score = z.number().int().min(0).max(100000);
export const scoreInput = z.object({
  scores: z
    .object({ 1: score, 2: score, 3: score, 4: score, 5: score })
    .strict(),
  version: z.number().int().positive(),
});
export const editInput = eventInput.extend({
  version: z.number().int().positive(),
});
const orderIds = z
  .array(z.uuid())
  .max(100)
  .refine((ids) => new Set(ids).size === ids.length);
export const reorderInput = z.object({
  ids: orderIds,
  expectedIds: orderIds,
});
export const loginInput = z.object({
  username: z.string().trim().min(1).max(100),
  password: z.string().min(1).max(256),
});
