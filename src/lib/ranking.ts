import {
  CLASSES,
  type BoardSnapshot,
  type RankedClass,
  type Scores,
} from "./types";

export function rankScores(scores: Scores): RankedClass[] {
  const sorted = CLASSES.map((team) => ({
    ...team,
    score: scores[team.id],
  })).sort((a, b) => b.score - a.score || a.id - b.id);
  return sorted.map((team) => ({
    ...team,
    rank: sorted.findIndex((other) => other.score === team.score) + 1,
  }));
}

export function rankings(board: BoardSnapshot, eventId: string = "total") {
  const scores: Scores = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const event of board.events) {
    if (eventId !== "total" && event.id !== eventId) continue;
    for (const team of CLASSES) scores[team.id] += event.scores[team.id];
  }
  return rankScores(scores);
}

export function rankImprovements(
  previous: BoardSnapshot,
  next: BoardSnapshot,
  eventId: string,
) {
  if (
    eventId !== "total" &&
    !previous.events.some((event) => event.id === eventId)
  )
    return [];
  const before = rankings(previous, eventId);
  return rankings(next, eventId).filter(
    (team) => team.rank < before.find((other) => other.id === team.id)!.rank,
  );
}

export function changedOverallLeaders(
  previous: BoardSnapshot,
  next: BoardSnapshot,
) {
  const before = rankings(previous).filter(
    (team) => team.rank === 1 && team.score > 0,
  );
  const after = rankings(next).filter(
    (team) => team.rank === 1 && team.score > 0,
  );
  if (
    before.length === after.length &&
    before.every((team, index) => team.id === after[index].id)
  )
    return [];
  return after;
}
