import { readFile } from "node:fs/promises";
import { Pool } from "pg";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const client = await pool.connect();
try {
  await client.query("BEGIN");
  await client.query(
    await readFile(
      new URL("../migrations/001_initial.sql", import.meta.url),
      "utf8",
    ),
  );
  await client.query("COMMIT");
  console.log("Database schema is ready.");
} catch {
  await client.query("ROLLBACK");
  console.error(
    "Migration failed. Check database connectivity and schema permissions.",
  );
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
