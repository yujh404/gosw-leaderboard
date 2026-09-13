import { describe, expect, it } from "vitest";
import { eventInput, scoreInput, reorderInput } from "../src/lib/validation";
import { emptyScores } from "../src/lib/types";

describe("server input boundaries", () => {
  it("requires exactly five valid integer scores", () => {
    expect(
      scoreInput.safeParse({ scores: emptyScores(), version: 1 }).success,
    ).toBe(true);
    for (const bad of [-1, 1.5, 100001, "50", null])
      expect(
        scoreInput.safeParse({
          scores: { ...emptyScores(), 1: bad },
          version: 1,
        }).success,
      ).toBe(false);
    expect(scoreInput.safeParse({ scores: { 1: 1 }, version: 1 }).success).toBe(
      false,
    );
    expect(
      scoreInput.safeParse({ scores: { ...emptyScores(), 6: 1 }, version: 1 })
        .success,
    ).toBe(false);
    expect(scoreInput.safeParse({ scores: emptyScores() }).success).toBe(false);
  });
  it("rejects empty names, invalid status, and arbitrary photo URLs", () => {
    const input = {
      name: " 이어달리기 ",
      description: "",
      rules: "",
      status: "waiting",
      photoId: null,
    };
    expect(eventInput.parse(input).name).toBe("이어달리기");
    expect(eventInput.safeParse({ ...input, name: "  " }).success).toBe(false);
    expect(eventInput.safeParse({ ...input, status: "hidden" }).success).toBe(
      false,
    );
    expect(
      eventInput.safeParse({ ...input, photoId: "https://example.com/photo" })
        .success,
    ).toBe(false);
  });
  it("rejects duplicate IDs in a new event order", () => {
    const id = "9876fb36-e7c0-4d7a-bf77-baf123be3a0e";
    expect(reorderInput.safeParse({ ids: [id, id] }).success).toBe(false);
    expect(reorderInput.safeParse({ ids: [id] }).success).toBe(true);
  });
});
