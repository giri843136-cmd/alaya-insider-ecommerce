/**
 * ALAYA INSIDER — PostgreSQL Database Connection
 * --------------------------------------------------------------------------
 * Production-ready PostgreSQL connection pool with:
 *  - Environment-based configuration (dev/staging/prod)
 *  - Connection pooling with configurable pool size
 *  - Automatic retry with exponential backoff
 *  - SSL support for production
 *  - Health checks via pool.query
 *  - Graceful shutdown
 */

import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/* ================================================================== */
/*  ENVIRONMENT CONFIGURATION                                          */
/* ================================================================== */

export type Environment = "development" | "staging" | "production";

function getEnvironment(): Environment {
  const env = (process.env.NODE_ENV || "development").toLowerCase();
  if (env === "production" || env === "prod") return "production";
  if (env === "staging") return "staging";
  return "development";
}

export const ENV = getEnvironment();

interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl: boolean | { rejectUnauthorized: boolean };
  maxConnections: number;
  idleTimeoutMs: number;
  connectionTimeoutMs: number;
}

function loadDatabaseConfig(): DatabaseConfig {
  // Support DATABASE_URL (single connection string) or individual env vars
  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl) {
    const url = new URL(databaseUrl);
    return {
      host: url.hostname,
      port: Number(url.port) || 5432,
      database: url.pathname.replace(/^\//, ""),
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      ssl: (ENV === "production" && process.env.DB_SSL !== "false")
        ? { rejectUnauthorized: process.env.NODE_TLS_REJECT_UNAUTHORIZED === "0" ? false : true }
        : (process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false),
      maxConnections: Number(process.env.DB_MAX_CONNECTIONS) || 20,
      idleTimeoutMs: Number(process.env.DB_IDLE_TIMEOUT) || 30_000,
      connectionTimeoutMs: Number(process.env.DB_CONNECT_TIMEOUT) || 10_000,
    };
  }

  return {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || `alaya_insider_${ENV}`,
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
    ssl: (ENV === "production" && process.env.DB_SSL !== "false")
      ? { rejectUnauthorized: process.env.NODE_TLS_REJECT_UNAUTHORIZED === "0" ? false : true }
      : (process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false),
    maxConnections: Number(process.env.DB_MAX_CONNECTIONS) || 20,
    idleTimeoutMs: Number(process.env.DB_IDLE_TIMEOUT) || 30_000,
    connectionTimeoutMs: Number(process.env.DB_CONNECT_TIMEOUT) || 10_000,
  };
}

/* ================================================================== */
/*  CONNECTION POOL                                                    */
/* ================================================================== */

let pool: pg.Pool | null = null;

export function getPool(): pg.Pool {
  if (pool) return pool;

  const cfg = loadDatabaseConfig();

  pool = new Pool({
    host: cfg.host,
    port: cfg.port,
    database: cfg.database,
    user: cfg.user,
    password: cfg.password,
    ssl: cfg.ssl,
    max: cfg.maxConnections,
    idleTimeoutMillis: cfg.idleTimeoutMs,
    connectionTimeoutMillis: cfg.connectionTimeoutMs,
    // Application name for monitoring
    application_name: `alaya-insider-api-${ENV}`,
  });

  // Log pool errors so they don't crash the process
  pool.on("error", (err: Error) => {
    console.error(`[DB] Unexpected pool error: ${err.message}`);
  });

  // Log new connections
  pool.on("connect", () => {
    if (process.env.NODE_ENV !== "production") {
      console.log(`[DB] New connection established (pool size: ${pool?.totalCount ?? "?"})`);
    }
  });

  console.log(`[DB] Connection pool initialized for ${cfg.database}@${cfg.host}:${cfg.port} (env: ${ENV})`);

  return pool;
}

/* ================================================================== */
/*  HEALTH CHECK                                                       */
/* ================================================================== */

export interface DbHealth {
  status: "healthy" | "degraded" | "unhealthy";
  poolTotal: number;
  poolActive: number;
  poolIdle: number;
  poolWaiting: number;
  latencyMs: number;
  env: Environment;
  database: string;
}

export async function checkDbHealth(): Promise<DbHealth> {
  const p = getPool();
  const t0 = performance.now();
  try {
    await p.query("SELECT 1");
    const latencyMs = Math.round(performance.now() - t0);
    return {
      status: "healthy",
      poolTotal: p.totalCount,
      poolActive: p.totalCount - p.idleCount,
      poolIdle: p.idleCount,
      poolWaiting: p.waitingCount,
      latencyMs,
      env: ENV,
      database: (await p.query("SELECT current_database()")).rows[0].current_database,
    };
  } catch (err: unknown) {
    return {
      status: "unhealthy",
      poolTotal: p.totalCount,
      poolActive: p.totalCount - p.idleCount,
      poolIdle: p.idleCount,
      poolWaiting: p.waitingCount,
      latencyMs: Math.round(performance.now() - t0),
      env: ENV,
      database: "unknown",
    };
  }
}

/* ================================================================== */
/*  TRANSACTION HELPERS                                                */
/* ================================================================== */

/**
 * Execute a callback within a database transaction.
 * Auto-commits on success, auto-rolls back on error.
 */
export async function withTransaction<T>(
  fn: (client: pg.PoolClient) => Promise<T>,
): Promise<T> {
  const p = getPool();
  const client = await p.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err: unknown) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // Rollback failed — connection may be broken
    }
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Execute a callback within a database transaction using an existing client.
 * Useful for nested transaction contexts.
 */
export async function withTransactionClient<T>(
  client: pg.PoolClient,
  fn: (client: pg.PoolClient) => Promise<T>,
): Promise<T> {
  try {
    await client.query("SAVEPOINT sp");
    const result = await fn(client);
    await client.query("RELEASE SAVEPOINT sp");
    return result;
  } catch (err: unknown) {
    try {
      await client.query("ROLLBACK TO SAVEPOINT sp");
    } catch {
      // ignore
    }
    throw err;
  }
}

/* ================================================================== */
/*  CONNECTION RETRY                                                   */
/* ================================================================== */

/**
 * Retry database connection with exponential backoff.
 * Used during server startup to wait for PostgreSQL to be ready.
 */
export async function waitForDatabase(
  maxRetries = 10,
  baseDelayMs = 1000,
): Promise<boolean> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const p = getPool();
      await p.query("SELECT 1");
      console.log(`[DB] Connection established on attempt ${attempt}`);
      return true;
    } catch (err: unknown) {
      if (attempt === maxRetries) {
        console.error(`[DB] Failed to connect after ${maxRetries} attempts`);
        return false;
      }
      const delay = Math.min(baseDelayMs * Math.pow(2, attempt - 1), 30_000);
      console.log(`[DB] Connection attempt ${attempt} failed, retrying in ${delay}ms...`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  return false;
}

/* ================================================================== */
/*  GRACEFUL SHUTDOWN                                                  */
/* ================================================================== */

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    console.log("[DB] Connection pool closed");
  }
}

/* ================================================================== */
/*  QUERY HELPER                                                       */
/* ================================================================== */

/** Type-safe query helper with parameter binding. */
export async function query<T extends pg.QueryResultRow = any>(
  sql: string,
  params: any[] = [],
): Promise<pg.QueryResult<T>> {
  const p = getPool();
  return p.query<T>(sql, params);
}

/** Get a single row or null. */
export async function queryOne<T extends pg.QueryResultRow = any>(
  sql: string,
  params: any[] = [],
): Promise<T | null> {
  const result = await query<T>(sql, params);
  return result.rows[0] ?? null;
}

/** Get all rows. */
export async function queryAll<T extends pg.QueryResultRow = any>(
  sql: string,
  params: any[] = [],
): Promise<T[]> {
  const result = await query<T>(sql, params);
  return result.rows;
}

/* ================================================================== */
/*  PAGINATION                                                         */
/* ================================================================== */

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sort?: string;
  order?: "asc" | "desc";
  [key: string]: string | number | undefined;
}

/**
 * Build a paginated query with optional search, sort, and filter.
 * Returns the query string and parameters array.
 */
export function buildPaginatedQuery(
  baseQuery: string,
  params: ListParams = {},
  searchColumns: string[] = [],
  filterColumn?: string,
  filterValue?: string,
): { sql: string; queryParams: any[] } {
  const conditions: string[] = [];
  const queryParams: any[] = [];
  let paramIndex = 1;

  // Search
  if (params.search && searchColumns.length > 0) {
    const searchConditions = searchColumns.map((col) => {
      queryParams.push(`%${params.search}%`);
      return `${col}::text ILIKE $${paramIndex++}`;
    });
    conditions.push(`(${searchConditions.join(" OR ")})`);
  }

  // Filter
  if (filterColumn && filterValue) {
    queryParams.push(filterValue);
    conditions.push(`${filterColumn} = $${paramIndex++}`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  // Sort
  const allowedSorts = searchColumns.map((c) => c.replace(/.*\./, ""));
  const sortColumn = params.sort && allowedSorts.includes(params.sort) ? params.sort : "created_at";
  const sortDir = params.order === "desc" ? "DESC" : "ASC";

  // Pagination
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 24));
  const offset = (page - 1) * pageSize;

  queryParams.push(pageSize);
  queryParams.push(offset);

  const sql = `
    ${baseQuery} ${whereClause}
    ORDER BY ${sortColumn} ${sortDir}
    LIMIT $${paramIndex++} OFFSET $${paramIndex++}
  `;

  return { sql, queryParams };
}

/**
 * Get total count for a filtered query.
 */
export async function getTotalCount(
  baseCountQuery: string,
  params: ListParams = {},
  searchColumns: string[] = [],
): Promise<number> {
  const conditions: string[] = [];
  const queryParams: any[] = [];
  let paramIndex = 1;

  if (params.search && searchColumns.length > 0) {
    const searchConditions = searchColumns.map((col) => {
      queryParams.push(`%${params.search}%`);
      return `${col}::text ILIKE $${paramIndex++}`;
    });
    conditions.push(`(${searchConditions.join(" OR ")})`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const sql = `${baseCountQuery} ${whereClause}`;

  const result = await query<{ count: string }>(sql, queryParams);
  return Number(result.rows[0]?.count ?? 0);
}

/**
 * Execute a paginated query and return typed results.
 */
export async function paginatedQuery<T extends pg.QueryResultRow = any>(
  baseQuery: string,
  baseCountQuery: string,
  params: ListParams = {},
  searchColumns: string[] = [],
): Promise<PaginatedResult<T>> {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 24));

  const total = await getTotalCount(baseCountQuery, params, searchColumns);
  const { sql, queryParams } = buildPaginatedQuery(baseQuery, params, searchColumns);
  const result = await query<T>(sql, queryParams);

  return {
    data: result.rows,
    total,
    page,
    pageSize,
    hasMore: page * pageSize < total,
  };
}
