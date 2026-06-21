import { Pool, type PoolClient, type PoolConfig, type QueryResultRow } from "pg";
import { DatabaseUnavailableError, isDatabaseConnectionError } from "@/lib/db-errors";

const globalForPg = globalThis as unknown as { pgPool?: Pool };

function poolOptionsFromUrl(connectionString: string): PoolConfig {
  const config: PoolConfig = {
    connectionString,
    connectionTimeoutMillis: 10_000,
    idleTimeoutMillis: 30_000,
    max: 10,
  };

  try {
    const parsed = new URL(connectionString);
    const host = parsed.hostname;
    if (host !== "localhost" && host !== "127.0.0.1" && !parsed.searchParams.get("sslmode")) {
      config.ssl = { rejectUnauthorized: false };
    }
  } catch {
    // keep defaults
  }

  return config;
}

function createPool(): Pool {
  if (process.env.DATABASE_URL) {
    return new Pool(poolOptionsFromUrl(process.env.DATABASE_URL));
  }

  const host = process.env.PGHOST;
  const database = process.env.PGDATABASE;
  const user = process.env.PGUSER;
  const password = process.env.PGPASSWORD;

  if (!host || !database || !user || !password) {
    throw new Error(
      "Database not configured. Set DATABASE_URL or PGHOST, PGDATABASE, PGUSER, PGPASSWORD."
    );
  }

  const sslmode = process.env.PGSSLMODE ?? "prefer";

  return new Pool({
    host,
    port: process.env.PGPORT ? parseInt(process.env.PGPORT, 10) : 5432,
    database,
    user,
    password,
    connectionTimeoutMillis: 10_000,
    idleTimeoutMillis: 30_000,
    max: 10,
    ssl:
      sslmode === "disable"
        ? false
        : sslmode === "require"
          ? { rejectUnauthorized: false }
          : undefined,
  });
}

function getPool(): Pool {
  if (!globalForPg.pgPool) {
    globalForPg.pgPool = createPool();
  }
  return globalForPg.pgPool;
}

export const pool = new Proxy({} as Pool, {
  get(_target, prop) {
    return Reflect.get(getPool(), prop);
  },
});

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  try {
    const result = await getPool().query<T>(text, params);
    return result.rows;
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      throw new DatabaseUnavailableError();
    }
    throw error;
  }
}

export async function queryOne<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

export async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  let client: PoolClient;
  try {
    client = await getPool().connect();
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      throw new DatabaseUnavailableError();
    }
    throw error;
  }
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
