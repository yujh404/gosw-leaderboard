import "server-only";
import { Pool, type PoolClient } from "pg";

let pool: Pool | undefined;
export function getDb() {
  if (!process.env.DATABASE_URL)
    throw new Error("DATABASE_URL is not configured");
  pool ??= new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 3,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000,
  });
  return pool;
}

export async function transaction<T>(fn: (client: PoolClient) => Promise<T>) {
  const client = await getDb().connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
