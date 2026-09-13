import { describe, expect, it } from "vitest";
import { rankings, rankImprovements, rankScores } from "../src/lib/ranking";
import {
  emptyScores,
  type BoardSnapshot,
  type SportEvent,
  type Scores,
} from "../src/lib/types";

const event = (
  id: string,
  scores: Scores,
  status: SportEvent["status"] = "waiting",
): SportEvent => ({
  id,
  name: id,
  description: "",
  rules: "",
  status,
  photoId: null,
  position: 0,
  version: 1,
  scores,
});
const board = (...events: SportEvent[]): BoardSnapshot => ({
  events,
  updatedAt: "2026-09-13T00:00:00Z",
});

describe("rankings", () => {
  it("uses competition ranking for ties, with stable class order", () => {
    expect(
      rankScores({ 1: 30, 2: 50, 3: 50, 4: 0, 5: 10 }).map(({ id, rank }) => [
        id,
        rank,
      ]),
    ).toEqual([
      [2, 1],
      [3, 1],
      [1, 3],
      [5, 4],
      [4, 5],
    ]);
  });
  it("starts all five classes at joint first with no points", () => {
    expect(rankings(board()).map(({ score, rank }) => [score, rank])).toEqual(
      Array(5).fill([0, 1]),
    );
  });
  it("totals all entered scores regardless of event status", () => {
    const result = rankings(
      board(
        event("a", { ...emptyScores(), 1: 30 }),
        event("b", { ...emptyScores(), 2: 50 }, "live"),
        event("c", { ...emptyScores(), 1: 40 }, "completed"),
      ),
    );
    expect(result[0]).toMatchObject({ id: 1, score: 70, rank: 1 });
    expect(result[1]).toMatchObject({ id: 2, score: 50, rank: 2 });
  });
  it("keeps event ranking separate from total ranking", () => {
    const state = board(
      event("a", { ...emptyScores(), 1: 100 }),
      event("b", { ...emptyScores(), 5: 60 }),
    );
    expect(rankings(state, "b")[0]).toMatchObject({ id: 5, score: 60 });
    expect(rankings(state)[0]).toMatchObject({ id: 1, score: 100 });
  });
  it("celebrates every rising class, including reaching a tie", () => {
    const before = board(event("a", { 1: 100, 2: 80, 3: 60, 4: 40, 5: 20 }));
    const after = board(event("a", { 1: 100, 2: 100, 3: 60, 4: 120, 5: 20 }));
    expect(
      rankImprovements(before, after, "total").map(({ id, rank }) => [
        id,
        rank,
      ]),
    ).toEqual([[4, 1]]);
    const tied = board(event("a", { 1: 100, 2: 100, 3: 60, 4: 40, 5: 20 }));
    expect(
      rankImprovements(before, tied, "a").map(({ id, rank }) => [id, rank]),
    ).toEqual([[2, 1]]);
  });
  it("does not celebrate a baseline, unchanged score, or a new event", () => {
    const state = board(event("a", { 1: 100, 2: 80, 3: 60, 4: 40, 5: 20 }));
    expect(rankImprovements(state, state, "total")).toEqual([]);
    expect(rankImprovements(board(), state, "a")).toEqual([]);
    expect(
      rankImprovements(board(event("a", emptyScores())), state, "a"),
    ).toEqual([]);
  });
});
