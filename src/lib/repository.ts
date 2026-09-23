import "server-only";
import { getDb, transaction } from "./db";
import { HttpError } from "./errors";
import { emptyScores, type BoardSnapshot, type SportEvent } from "./types";
import type { z } from "zod";
import type { eventInput, editInput, scoreInput, reorderInput } from "./validation";

const columns = `id, name, description, rules, status, photo_id AS "photoId", position, version, scores`;

export async function readBoard(): Promise<BoardSnapshot> {
  const { rows } = await getDb().query<SportEvent>(
    `SELECT ${columns} FROM events ORDER BY position, id`,
  );
  return { events: rows, updatedAt: new Date().toISOString() };
}

export async function createEvent(input: z.infer<typeof eventInput>) {
  return transaction(async (client) => {
    await client.query("SELECT pg_advisory_xact_lock(202601)");
    const { rows: count } = await client.query(
      "SELECT count(*)::int AS count FROM events",
    );
    if (count[0].count >= 100)
      throw new HttpError(400, "종목은 최대 100개까지 등록할 수 있습니다.");
    const { rows } = await client.query<SportEvent>(
      `INSERT INTO events(name, description, rules, status, photo_id, position, scores)
      VALUES($1,$2,$3,$4,$5,(SELECT COALESCE(max(position), -1) + 1 FROM events),$6) RETURNING ${columns}`,
      [
        input.name,
        input.description,
        input.rules,
        input.status,
        input.photoId,
        JSON.stringify(emptyScores()),
      ],
    );
    return rows[0];
  });
}

export async function editEvent(id: string, input: z.infer<typeof editInput>) {
  const { rows } = await getDb().query<SportEvent>(
    `UPDATE events SET name=$1, description=$2, rules=$3, status=$4, photo_id=$5,
    version=version+1, updated_at=now() WHERE id=$6 AND version=$7 RETURNING ${columns}`,
    [
      input.name,
      input.description,
      input.rules,
      input.status,
      input.photoId,
      id,
      input.version,
    ],
  );
  if (!rows.length)
    throw new HttpError(
      409,
      "다른 선생님이 이 종목을 변경했습니다. 최신 내용을 불러온 후 다시 저장해 주세요.",
    );
  return rows[0];
}

export async function saveScores(
  id: string,
  input: z.infer<typeof scoreInput>,
) {
  const { rows } = await getDb().query<SportEvent>(
    `UPDATE events SET scores=$1, version=version+1, updated_at=now()
    WHERE id=$2 AND version=$3 RETURNING ${columns}`,
    [JSON.stringify(input.scores), id, input.version],
  );
  if (!rows.length)
    throw new HttpError(
      409,
      "다른 선생님이 이 종목을 변경했습니다. 최신 내용을 불러온 후 다시 저장해 주세요.",
    );
  return rows[0];
}

export async function reorderEvents({
  ids,
  expectedIds,
}: z.infer<typeof reorderInput>) {
  await transaction(async (client) => {
    await client.query("SELECT pg_advisory_xact_lock(202601)");
    const { rows } = await client.query<{ id: string }>(
      "SELECT id FROM events ORDER BY position, id",
    );
    if (
      rows.length !== ids.length ||
      rows.length !== expectedIds.length ||
      rows.some((event, index) => event.id !== expectedIds[index]) ||
      rows.some((event) => !ids.includes(event.id))
    ) {
      throw new HttpError(
        409,
        "종목 목록이나 순서가 변경되었습니다. 새로고침 후 다시 정렬해 주세요.",
      );
    }
    await client.query(
      `UPDATE events SET position=ordering.ordinality-1 FROM unnest($1::uuid[]) WITH ORDINALITY AS ordering(id, ordinality)
      WHERE events.id=ordering.id`,
      [ids],
    );
  });
}
