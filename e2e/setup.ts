import { Pool } from "pg";
import { readFile } from "node:fs/promises";

export default async function setup() {
  const connectionString =
    process.env.E2E_DATABASE_URL ??
    "postgresql://gosw_test:gosw_test@127.0.0.1:55426/gosw_e2e";
  const url = new URL(connectionString);
  if (
    !["127.0.0.1", "localhost"].includes(url.hostname) ||
    url.pathname !== "/gosw_e2e"
  )
    throw new Error("E2E requires an isolated local gosw_e2e database.");
  const pool = new Pool({ connectionString });
  try {
    await pool.query(
      await readFile(
        new URL("../migrations/001_initial.sql", import.meta.url),
        "utf8",
      ),
    );
    await pool.query("TRUNCATE events, photos, sessions, login_attempts");
  } finally {
    await pool.end();
  }
}
